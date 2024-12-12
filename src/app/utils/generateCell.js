import generateFigure from "./generateFigure";
import generatePorts from "./generatePorts";

const style1 = {editable: true}
const style2 = {editable: false}
export default function generateCell(graph,type, title, subtitle) {
    let cell;
    if(type.indexOf('Valve') !== -1) {
        cell = generateFigure(graph, 110, 100, type, type, style2)
        generatePorts(graph, cell, 0, 5, { rightport1: 'state', rightport2: 'on', rightport3: 'off', rightport4: 'toggle', rightport5:'error'})
    } else if(type.indexOf('transition') !== -1) {
        cell = generateFigure(graph, 160, 60, title, subtitle, style1)
        generatePorts(graph, cell, 3, 2, {leftport1: 'Step', leftport2: 'IN1', leftport3: 'IN2',  rightport1: 'true', rightport2: 'false'})
    } else if (type.indexOf('step') !== -1) {
        cell = generateFigure(graph, 110, 200, type, type, style2)
        generatePorts(graph, cell, 1, 10, {leftport1: 'BEGIN', rightport1: 'CMD1', rightport2: 'CMD2', rightport3: 'CMD3', rightport4: 'CMD4', rightport5: 'CMD5', rightport6: 'CMD6', rightport7: 'CMD7', rightport8: 'CMD8', rightport9: 'CMD9', rightport10: 'FINISH'})
    } else if (type === 'start') {
        cell = generateFigure(graph, 60, 20, type, null, style2)
        generatePorts(graph, cell, 0, 1, null)
    } else if (type === 'exit') {
        cell = generateFigure(graph, 60, 20, type, null, style2)
        generatePorts(graph, cell, 1, 0, null)
    } else if (type === 'exec') {
        cell = generateFigure(graph, 80, 40, title, subtitle, style2)
        generatePorts(graph, cell, 2, 0, {leftport1: 'value', leftport2: 'CMD'})
    } else if (type === 'mainlog') {
        cell = generateFigure(graph, 110, 20, title, subtitle, style1)
        generatePorts(graph, cell, 1, 0, null)
    } else if(type === 'info') {
        cell = generateFigure(graph, 110, 60, title, subtitle, style1)
        generatePorts(graph, cell, 3, 0, {leftport1: 'step', leftport2: 'channel', leftport3: 'receiver'})
    } else if(type === 'channel' || type === 'receiver') {
        cell = generateFigure(graph, 110, 20, title, subtitle, style1)
        generatePorts(graph, cell, 0, 1, null)
    } else {
        cell = generateFigure(graph, 110, 120, type, type, style2)
        generatePorts(graph, cell, 0, 6, {rightport1: 'state', rightport2: 'auto',  rightport3: 'on', rightport4: 'off', rightport5: 'toggle', rightport6:'error'})
    }
    return cell
}