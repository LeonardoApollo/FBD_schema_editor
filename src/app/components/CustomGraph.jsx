import {
    styleUtils,
    mathUtils,
    cloneUtils,
    eventUtils,
    Graph,
    ConnectionHandler,
    ConnectionConstraint,
    Point,
    EdgeStyle,
    EdgeHandler,
    EdgeSegmentHandler,
    Guide,
    GraphView,
    SelectionHandler,
    InternalEvent,
  } from '@maxgraph/core';

export class MyCustomGuide extends Guide {
    // Alt disables guides
    isEnabledForEvent(evt) {
      return !eventUtils.isAltDown(evt);
    }
}

function isESC(evt) {
    console.log(evt)
    return evt.button === 27
}

class CustomGraphView extends GraphView {
    // Computes the position of edge to edge connection points.
    updateFixedTerminalPoint(edge, terminal, source, constraint) {
      let pt = null;
      if (constraint != null) {
        pt = this.graph.getConnectionPoint(terminal, constraint);
      }
      if (source) {
        edge.sourceSegment = null;
      } else {
        edge.targetSegment = null;
      }
      if (pt == null) {
        let s = this.scale;
        let tr = this.translate;
        let orig = edge.origin;
        let geo = edge.cell.getGeometry();
        pt = geo.getTerminalPoint(source);

        // Computes edge-to-edge connection point
        if (pt != null) {
          pt = new Point(s * (tr.x + pt.x + orig.x), s * (tr.y + pt.y + orig.y));

          // Finds nearest segment on edge and computes intersection
          if (terminal != null && terminal.absolutePoints != null) {
            let seg = mathUtils.findNearestSegment(terminal, pt.x, pt.y);

            // Finds orientation of the segment
            let p0 = terminal.absolutePoints[seg];
            let pe = terminal.absolutePoints[seg + 1];
            let horizontal = p0.x - pe.x === 0;

            // Stores the segment in the edge state
            let key = source ? 'sourceConstraint' : 'targetConstraint';
            let value = horizontal ? 'horizontal' : 'vertical';
            edge.style[key] = value;

            // Keeps the coordinate within the segment bounds
            if (horizontal) {
              pt.x = p0.x;
              pt.y = Math.min(pt.y, Math.max(p0.y, pe.y));
              pt.y = Math.max(pt.y, Math.min(p0.y, pe.y));
            } else {
              pt.y = p0.y;
              pt.x = Math.min(pt.x, Math.max(p0.x, pe.x));
              pt.x = Math.max(pt.x, Math.min(p0.x, pe.x));
            }
          }
        }
        // Computes constraint connection points on vertices and ports
        else if (terminal != null && terminal.cell.geometry.relative) {
          pt = new Point(this.getRoutingCenterX(terminal), this.getRoutingCenterY(terminal));
        }

      }
      edge.setAbsoluteTerminalPoint(pt, source);
    }
}

class CustomEdgeSegmentHandler extends EdgeSegmentHandler {
    clonePreviewState(point, terminal) {
      let clone = super.clonePreviewState.apply(this, arguments);
      clone.cell = clone.cell.clone();
      if (this.isSource || this.isTarget) {
        clone.cell.geometry = clone.cell.geometry.clone();

        // Sets the terminal point of an edge if we're moving one of the endpoints
        if (clone.cell.isEdge()) {
          // TODO: Only set this if the target or source terminal is an edge
          clone.cell.geometry.setTerminalPoint(point, this.isSource);
        } else {
          clone.cell.geometry.setTerminalPoint(null, this.isSource);
        }
      }
      return clone;
    }
}

export class CustomConnectionHandler extends ConnectionHandler {
    constructor(graph) {
        super(graph);
        this.isEscPressed = false; // Переменная для отслеживания состояния клавиши ESC
        this.initEscapeKeyHandler(); // Инициализация обработчика клавиши ESC
    }
    // Метод для инициализации обработчика клавиши ESC
    initEscapeKeyHandler() {
        // Добавляем обработчик нажатия клавиши ESC
        InternalEvent.addListener(document, 'keydown', (evt) => {
            if (evt.key === 'Escape') {
                this.isEscPressed = true; // Устанавливаем флаг, если ESC нажат
                this.isStopEvent({getState: () => 1, isEdge: true})
            }
        });

        // Добавляем обработчик отпускания клавиши ESC
        InternalEvent.addListener(document, 'keyup', (evt) => {
            if (evt.key === 'Escape') {
                this.isEscPressed = false; // Сбрасываем флаг, если ESC отпущен
            }
        });
    }
    // If connect preview is not moved away then getCellAt is used to detect the cell under
    // the mouse if the mouse is over the preview shape in IE (no event transparency), ie.
    // the built-in hit-detection of the HTML document will not be used in this case.
    movePreviewAway = false;
    waypointsEnabled = true;

    // Starts connections on the background in wire-mode
    isStartEvent(me) {
      return super.isStartEvent.apply(this, arguments);
    }

    // Avoids any connections for gestures within tolerance except when in wire-mode
    // or when over a port
    mouseUp(sender, me) {
      if (this.first != null && this.previous != null) {
        let point = styleUtils.convertPoint(this.graph.container, me.getX(), me.getY());
        let dx = Math.abs(point.x - this.first.x);
        let dy = Math.abs(point.y - this.first.y);
        if (dx < this.graph.tolerance && dy < this.graph.tolerance) {
          // Selects edges in non-wire mode for single clicks, but starts
          // connecting for non-edges regardless of wire-mode
          if (this.previous.cell.isEdge()) {
            this.reset();
          }
          return;
        }
      }
      super.mouseUp.apply(this, arguments);
    }

    // Overrides methods to preview and create new edges.

    // Sets source terminal point for edge-to-edge connections.
    createEdgeState(me) {
      let edge = this.graph.createEdge();
      if (this.sourceConstraint != null && this.previous != null) {
        edge.style = 'exitX' + '=' + this.sourceConstraint.point.x + ';' + 'exitY' + '=' + this.sourceConstraint.point.y + ';';
      } else if (me.getCell().isEdge()) {
        let scale = this.graph.view.scale;
        let tr = this.graph.view.translate;
        let pt = new Point(this.graph.snap(me.getGraphX() / scale) - tr.x, this.graph.snap(me.getGraphY() / scale) - tr.y);
        edge.geometry.setTerminalPoint(pt, true);
      }
      return this.graph.view.createState(edge);
    }

    is

    // Uses right mouse button to create edges on background (see also: lines 67 ff)
    isStopEvent(me) {
        console.log('peace of shit')
      return this.isEscPressed || (me.getState() != null || eventUtils.isRightMouseButton(me.getEvent())) ;
    }

    // Updates target terminal point for edge-to-edge connections.
    updateCurrentState(me, point) {
      super.updateCurrentState.apply(this, arguments);
      if (this.edgeState != null) {
        this.edgeState.cell.geometry.setTerminalPoint(null, false);
        if (this.shape != null && this.currentState != null && this.currentState.cell.isEdge()) {
          let scale = this.graph.view.scale;
          let tr = this.graph.view.translate;
          let pt = new Point(this.graph.snap(me.getGraphX() / scale) - tr.x, this.graph.snap(me.getGraphY() / scale) - tr.y);
          this.edgeState.cell.geometry.setTerminalPoint(pt, false);
        }
      }
    }

    // Adds in-place highlighting for complete cell area (no hotspot).
    createMarker() {
      let marker = super.createMarker.apply(this, arguments);

      // Uses complete area of cell for new connections (no hotspot)
      marker.intersects = function (state, evt) {
        return true;
      };

      // Adds in-place highlighting
      marker.highlight.highlight = function (state) {
        if (this.state != state) {
          if (this.state != null) {
            this.state.style = this.lastStyle;

            // Workaround for shape using current stroke width if no strokewidth defined
            this.state.style.strokeWidth = this.state.style.strokeWidth || '1';
            this.state.style.strokeColor = this.state.style.strokeColor || 'none';
            if (this.state.shape != null) {
              this.state.view.graph.cellRenderer.configureShape(this.state);
              this.state.shape.redraw();
            }
          }
          if (state != null) {
            this.lastStyle = state.style;
            state.style = cloneUtils.clone(state.style);
            state.style.strokeColor = '#00ff00';
            state.style.strokeWidth = '1';
            if (state.shape != null) {
              state.view.graph.cellRenderer.configureShape(state);
              state.shape.redraw();
            }
          }
          this.state = state;
        }
      };
      return marker;
    }

    // Makes sure non-relative cells can only be connected via constraints
    isConnectableCell(cell) {
      if (cell.isEdge()) {
        return true;
      } else {
        let geo = cell != null ? cell.getGeometry() : null;
        return geo != null ? geo.relative : false;
      }
    }
}

class CustomEdgeHandler extends EdgeHandler {
    // Enables snapping waypoints to terminals
    snapToTerminals = true;
    isConnectableCell(cell) {
      return graph.getPlugin('ConnectionHandler').isConnectableCell(cell);
    }
    connect(edge, terminal, isSource, isClone, me) {
      let result = null;
      let model = this.graph.getDataModel();
      let parent = model.getParent(edge);
      model.beginUpdate();
      try {
        result = super.connect.apply(this, arguments);
        let geo = model.getGeometry(result);
        if (geo != null) {
          geo = geo.clone();
          let pt = null;
          if (terminal.isEdge()) {
            pt = this.abspoints[this.isSource ? 0 : this.abspoints.length - 1];
            pt.x = pt.x / this.graph.view.scale - this.graph.view.translate.x;
            pt.y = pt.y / this.graph.view.scale - this.graph.view.translate.y;
            let pstate = this.graph.getView().getState(edge.getParent());
            if (pstate != null) {
              pt.x -= pstate.origin.x;
              pt.y -= pstate.origin.y;
            }
            pt.x -= this.graph.panDx / this.graph.view.scale;
            pt.y -= this.graph.panDy / this.graph.view.scale;
          }
          geo.setTerminalPoint(pt, isSource);
          model.setGeometry(edge, geo);
        }
      } finally {
        model.endUpdate();
      }
      return result;
    }
    createMarker() {
      let marker = super.createMarker.apply(this, arguments);
      // Adds in-place highlighting when reconnecting existing edges
      marker.highlight.highlight = this.graph.getPlugin('ConnectionHandler').marker.highlight.highlight;
      return marker;
    }
}

export class CustomSelectionHandler extends SelectionHandler {
    previewColor = invert ? 'white' : 'black';
    // Enables guides
    guidesEnabled = true;
    createGuide() {
      return new CustomGuide(this.graph, this.getGuideStates());
    }
  }

export class CustomGraph extends Graph {
    resetEdgesOnConnect = false;

    createEdgeSegmentHandler(state) {
      return new CustomEdgeSegmentHandler(state);
    }

    createGraphView() {
      return new CustomGraphView(this);
    }

    createEdgeHandler(state) {
      return new CustomEdgeHandler(state);
    }

    createHandler(state) {
      let result = null;

      if (state != null) {
        if (state.cell.isEdge()) {
          let style = this.view.getEdgeStyle(state);

          if (style == EdgeStyle.WireConnector) {
            return new EdgeSegmentHandler(state);
          }
        }
      }

      return super.createHandler.apply(this, arguments);
    }
    // Alternative solution for implementing connection points without child cells.
    // This can be extended as shown in portrefs.html example to allow for per-port
    // incoming/outgoing direction.
    getAllConnectionConstraints(terminal) {
      let geo = terminal != null ? terminal.cell.getGeometry() : null;

      if (
        (geo != null ? !geo.relative : false) &&
        terminal.cell.isVertex() &&
        terminal.cell.getChildCount() === 0
      ) {
        return [
          new ConnectionConstraint(new Point(0, 0.5), false),
          new ConnectionConstraint(new Point(1, 0.5), false),
        ];
      }
      return null;
    }
}