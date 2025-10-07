const buttonIds = ["btn1", "btn2", "btn3", "btn4", "btn5", "btn6", "btn7", "btn8", "btn9"];
$(document).ready(function () {
    let isLocked = true;

    function resetLabelButtons() {
        buttonIds.forEach((btnId) => {
            $("#" + btnId).css("border", "3px solid transparent");;
            $("#" + btnId).css("font-weight", "normal");
        });

        // If another button is in edit mode, reset it
        let editingButton = $(".in-edit-mode");
        if (editingButton.length) {
            let originalText = editingButton.find('.btn-edit-input').val();
            editingButton.text(originalText).removeClass("in-edit-mode");
        }
    }

    function setLabelButtons() {
        resetLabelButtons();
        $("#btn9").css("border", "3px solid #77F2A1");
        $("#btn9").css("font-weight", "bold");
    }

    setLabelButtons();

    buttonIds.forEach(function (btnId) {
        $("#" + btnId).click(function (e) {
            e.stopPropagation();

            if (isLocked) {
                buttonIds.forEach(function (id) {
                    $("#" + id).css("border", "3px solid transparent");
                    $("#" + id).css("font-weight", "normal");
                });

                // Add green border to clicked button
                $(this).css("border", "3px solid #77F2A1");
                $(this).css("font-weight", "bold");
                return;
            }

            let currentButton = $(this);

            // If another button is in edit mode, reset it
            let editingButton = $(".in-edit-mode");
            if (editingButton.length) {
                let originalText = editingButton.find('.btn-edit-input').val();
                editingButton.text(originalText).removeClass("in-edit-mode");
            }

            let currentText = currentButton.text();

            // Create an input field and a confirm button
            let inputField = $("<input type='text' class='btn-edit-input' value='" + currentText + "'>");
            let confirmButton = $("<button class='btn btn-small btn-confirm'>✓</button>");
            let combined = $(`<div class="d-flex flex-row"></div>`);
            combined.append(inputField);
            combined.append(confirmButton);

            // Add the confirm button functionality
            confirmButton.click(function (e) {
                e.stopPropagation();
                currentButton.text(inputField.val());
                log("Changed label to '" + inputField.val() + "'.");
                currentButton.removeClass("in-edit-mode");
            });

            currentButton.text("").append(combined).addClass("in-edit-mode");
            inputField.focus();


        });
    });

    $("#lockButton").click(function () {
        isLocked = !isLocked;

        if (isLocked) {
            $(this).html('<i class="bi bi-lock"></i>');
            $(this).addClass("btn-stop");
            $(this).removeClass("btn-play");
            setLabelButtons();
        } else {
            $(this).html('<i class="bi bi-unlock"></i>');
            $(this).removeClass("btn-stop");
            $(this).addClass("btn-play");
            resetLabelButtons();

            $("#btn1").click();
        }
    });

    $('#startRecordingButton').click(() => { startRecording() });
    $('#stopRecordingButton').click(() => { stopRecording() });

    function getCurrentlySelectedLabel() {
        let selectedButton = buttonIds.filter((btnId) => {
            return $("#" + btnId).css("border") === "3px solid rgb(119, 242, 161)" && btnId !== "btn9";
        });
        if (selectedButton.length) {
            return $("#" + selectedButton[0]).text();
        }
        return null;
    }

    let recordingActive = false;
    let recordingStartTime;
    let dataCache = {};

    function startRecording() {
        
        recordingStartTime = new Date().toISOString();
        recordingActive = true;

        if (!isLocked) { $('#lockButton').click() }

        $('#startRecordingButton').addClass("d-none");
        $('#stopRecordingButton').removeClass("d-none");

        $(".is-record-enabled").prop('disabled', true);

        // 自动启动Sensor Control和Audio Control
        autoStartSensorAndAudioControls();
    }

    // 自动启动Sensor Control和Audio Control面板的功能
    function autoStartSensorAndAudioControls() {
        // 自动启动Sensor Control - 只有在未启动时才启动
        if ($('#testOcclusionButton').length && !$('#testOcclusionButton').prop('disabled')) {
            // 检查按钮文本，如果显示"Test Occl."说明未启动，需要启动
            if ($('#testOcclusionButton').text().trim() === "Test Occl.") {
                $('#testOcclusionButton').click();
                log("自动启动传感器测试", "MESSAGE");
            } else {
                log("传感器测试已在运行中", "MESSAGE");
            }
        }

        // 自动启动Audio Control - 只有在未播放时才播放
        if ($('#button-play-audio').length && !$('#button-play-audio').prop('disabled')) {
            // 检查播放按钮是否可用，如果可用说明未在播放
            if (!$('#button-play-audio').prop('disabled')) {
                $('#button-play-audio').click();
                log("自动开始播放音频", "MESSAGE");
            } else {
                log("音频已在播放中", "MESSAGE");
            }
        }
    }

    // 自动停止Sensor Control和Audio Control面板的功能
    function autoStopSensorAndAudioControls() {
        // 自动停止Sensor Control - 只有在运行中时才停止
        if ($('#testOcclusionButton').length && !$('#testOcclusionButton').prop('disabled')) {
            // 检查按钮文本，如果显示"Stop"说明正在运行，需要停止
            if ($('#testOcclusionButton').text().trim() === "Stop") {
                $('#testOcclusionButton').click();
                log("自动停止传感器测试", "MESSAGE");
            } else {
                log("传感器测试未在运行", "MESSAGE");
            }
        }

        // 自动停止Audio Control - 只有在播放中时才停止
        if ($('#button-stop-audio').length && !$('#button-stop-audio').prop('disabled')) {
            // 检查停止按钮是否可用，如果可用说明正在播放
            if (!$('#button-stop-audio').prop('disabled')) {
                $('#button-stop-audio').click();
                log("自动停止音频播放", "MESSAGE");
            } else {
                log("音频未在播放", "MESSAGE");
            }
        }
    }

    function stopRecording() {
        recordingActive = false;

        $('#startRecordingButton').removeClass("d-none");
        $('#stopRecordingButton').addClass("d-none");
        $(".is-record-enabled").prop('disabled', false);

        generateAndDownloadCSV(dataCache, recordingStartTime);
        dataCache = {};  // Reset data cache after download

        // 自动停止Sensor Control和Audio Control
        autoStopSensorAndAudioControls();
    }

    openEarable.sensorManager.subscribeOnSensorDataReceived((sensorData) => {
        if (!recordingActive) return;

        if (!dataCache[sensorData.timestamp]) {
            // Initialize the cache entry for this timestamp
            dataCache[sensorData.timestamp] = {
                acc: [],
                gyro: [],
                mag: [],
                pressure: "",
                temperature: "",
                labels: []  // Storing the labels as an array to handle multiple labels
            };
        }

        let currentLabel = getCurrentlySelectedLabel();
        if (currentLabel && !dataCache[sensorData.timestamp].labels.includes(currentLabel)) {
            dataCache[sensorData.timestamp].labels.push(currentLabel);
        }

        switch (sensorData.sensorId) {
            case 0: // IMU data (Accelerometer, Gyroscope, Magnetometer)
                dataCache[sensorData.timestamp].acc = [-sensorData.ACC.X, sensorData.ACC.Z, sensorData.ACC.Y];
                dataCache[sensorData.timestamp].gyro = [-sensorData.GYRO.X, sensorData.GYRO.Z, sensorData.GYRO.Y];
                dataCache[sensorData.timestamp].mag = [-sensorData.MAG.X, sensorData.MAG.Z, sensorData.MAG.Y];
                break;

            case 1: // Pressure and Temperature
                dataCache[sensorData.timestamp].pressure = sensorData.BARO.Pressure;
                dataCache[sensorData.timestamp].temperature = sensorData.TEMP.Temperature;
                break;
        }
    });

    function generateAndDownloadCSV(dataCache, recordingStartTime) {
        generateAndDownloadIMUCSV(dataCache, recordingStartTime);
        generateAndDownloadTempPressCSV(dataCache, recordingStartTime);
    }

    function generateAndDownloadIMUCSV(dataCache, recordingStartTime) {
        let headers = [
            "time", "sensor_accX[g]", "sensor_accY[g]", "sensor_accZ[g]",
            "sensor_gyroX[°/s]", "sensor_gyroY[°/s]", "sensor_gyroZ[°/s]",
            "sensor_magX[µT]", "sensor_magY[µT]", "sensor_magZ[µT]"
        ];
    
        let rows = [];
    
        // Sorting the timestamps and generating the CSV lines
        Object.keys(dataCache).sort().forEach(timestamp => {
            let data = dataCache[timestamp];
            let row = [timestamp];
    
            // Push IMU sensor data ensuring the correct float format
            let hasData = false;
            ["acc", "gyro", "mag"].forEach(sensorType => {
                if (data[sensorType] && data[sensorType].length === 3) {
                    row.push(...data[sensorType].map(val => val.toString().replace(',', '.')));
                    hasData = true;
                } else {
                    row.push('', '', ''); // Fill with empty values but do not count as data
                }
            });
    
            // Only add rows with data to the CSV
            if (hasData) {
                rows.push(row);
            }
        });
    
        let csv = headers.join(",") + "\n" + rows.map(row => row.join(",")).join("\n");
    
        // Trigger a download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `IMU_recording_${recordingStartTime}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    

    function generateAndDownloadTempPressCSV(dataCache, recordingStartTime) {
        let headers = [
            "time", "sensor_pressure[Pa]", "sensor_temperature[°C]"
        ];
    
        let rows = [];
    
        // Sorting the timestamps and generating the CSV lines
        Object.keys(dataCache).sort().forEach(timestamp => {
            let data = dataCache[timestamp];
            let row = [timestamp];
    
            // Push temperature and pressure data ensuring the correct float format
            let pressure = data.pressure ? data.pressure.toString().replace(',', '.') : '';
            let temperature = data.temperature ? data.temperature.toString().replace(',', '.') : '';
    
            // Only add rows with temperature or pressure data
            if (pressure || temperature) {
                row.push(pressure, temperature);
                rows.push(row);
            }
        });
    
        let csv = headers.join(",") + "\n" + rows.map(row => row.join(",")).join("\n");
    
        // Trigger a download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `TempPress_recording_${recordingStartTime}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    


});
