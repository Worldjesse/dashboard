/* logging */
function log(message, type = "MESSAGE") {
    var typeColorMap = {
        "ERROR": "#f27777",
        "WARNING": "#e0f277",
        "SUCCESS": "#77F2A1",
        "MESSAGE": "#aaa",
    }

    const now = new Date();
    const localTime = now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0') + ' ' + 
        String(now.getHours()).padStart(2, '0') + ':' + 
        String(now.getMinutes()).padStart(2, '0') + ':' + 
        String(now.getSeconds()).padStart(2, '0') + '.' + 
        String(now.getMilliseconds()).padStart(3, '0');
    
    $("#log").prepend(`<div style="color: ${typeColorMap[type]}"><b>${localTime} - ${type}:</b> <span style="color: white;">${message}</span></div>`)
}

function onClearLog() {
    $('#log').empty();
}