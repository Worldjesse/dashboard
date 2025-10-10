/**
 * SD卡记录管理器
 * 处理传感器数据直接记录到OpenEarable设备SD卡的功能
 */
class SDRecordingManager {
    constructor() {
        this.isConnected = false;
        this.recordingState = RECORDING_STATE.IDLE;
        this.currentConfig = null;
        
        // 绑定事件处理器
        this.bindEventHandlers();
        
        // 订阅连接状态变化
        if (typeof openEarable !== 'undefined') {
            openEarable.bleManager.subscribeOnConnected(() => {
                this.isConnected = true;
                this.enableControls();
                this.initializeSDRecording();
            });
            
            openEarable.bleManager.subscribeOnDisconnected(() => {
                this.isConnected = false;
                this.disableControls();
                this.resetRecordingState();
            });
        }
    }

    /**
     * 绑定事件处理器
     */
    bindEventHandlers() {
        // 开始记录按钮
        $('#startSDRecordingButton').click(() => {
            this.startRecording();
        });

        // 停止记录按钮
        $('#stopSDRecordingButton').click(() => {
            this.stopRecording();
        });

        // 暂停记录按钮
        $('#pauseSDRecordingButton').click(() => {
            this.pauseRecording();
        });

        // 恢复记录按钮
        $('#resumeSDRecordingButton').click(() => {
            this.resumeRecording();
        });

        // 传感器选择变化
        $('#sdRecordPressure, #sdRecordTemperature, #sdRecordIMU').change(() => {
            this.updateStartButtonState();
        });
    }

    /**
     * 初始化SD卡记录功能
     */
    async initializeSDRecording() {
        try {
            if (typeof openEarable === 'undefined' || !openEarable.sensorRecorder) {
                log("SD卡记录功能不可用", "WARNING");
                return;
            }

            // 订阅记录状态变化
            openEarable.sensorRecorder.subscribeOnRecordingStatusChanged((state, config) => {
                try {
                    this.recordingState = state;
                    this.currentConfig = config;
                    this.updateUI();
                } catch (error) {
                    console.error("处理记录状态变化时出错:", error);
                }
            });

            // 获取当前记录状态
            try {
                await openEarable.sensorRecorder.getRecordingStatus();
            } catch (error) {
                log("获取记录状态失败: " + error.message, "WARNING");
            }
            
            try {
                await openEarable.sensorRecorder.getRecordingConfig();
            } catch (error) {
                log("获取记录配置失败: " + error.message, "WARNING");
            }
            
            log("SD卡记录功能初始化完成", "SUCCESS");
        } catch (error) {
            log("SD卡记录功能初始化失败: " + error.message, "ERROR");
        }
    }

    /**
     * 开始记录
     */
    async startRecording() {
        try {
            const sensorTypes = this.getSelectedSensorTypes();
            if (sensorTypes.length === 0) {
                log("请至少选择一个传感器类型", "WARNING");
                return;
            }

            const dataFormat = parseInt($('#sdDataFormat').val());
            const fileName = $('#sdFileName').val() || 'sensor_data';
            const samplingRate = parseInt($('#sdSamplingRate').val());

            // 验证输入参数
            if (!this.validateRecordingParameters(sensorTypes, dataFormat, fileName, samplingRate)) {
                return;
            }

            log(`开始记录传感器数据到SD卡: ${sensorTypes.join(', ')}`, "MESSAGE");
            
            await openEarable.sensorRecorder.startRecordingToSD(
                sensorTypes,
                dataFormat,
                fileName,
                samplingRate
            );

            this.updateUI();
        } catch (error) {
            SDRecordingErrorHandler.handleGenericError(error, "开始记录");
        }
    }

    /**
     * 验证记录参数
     */
    validateRecordingParameters(sensorTypes, dataFormat, fileName, samplingRate) {
        // 验证传感器类型
        if (!Array.isArray(sensorTypes) || sensorTypes.length === 0) {
            log("传感器类型无效", "ERROR");
            return false;
        }

        // 验证数据格式
        if (dataFormat < 0 || dataFormat > 2) {
            log("数据格式无效", "ERROR");
            return false;
        }

        // 验证文件名
        if (!fileName || fileName.trim() === '') {
            log("文件名不能为空", "ERROR");
            return false;
        }

        // 检查文件名是否包含非法字符
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(fileName)) {
            log("文件名包含非法字符", "ERROR");
            return false;
        }

        // 验证采样率
        if (samplingRate < 1 || samplingRate > 50) {
            log("采样率必须在1-50 Hz之间", "ERROR");
            return false;
        }

        return true;
    }

    /**
     * 停止记录
     */
    async stopRecording() {
        try {
            log("停止记录传感器数据到SD卡", "MESSAGE");
            await openEarable.sensorRecorder.stopRecordingToSD();
            this.updateUI();
        } catch (error) {
            SDRecordingErrorHandler.handleRecordingStateError(error);
        }
    }

    /**
     * 暂停记录
     */
    async pauseRecording() {
        try {
            log("暂停记录传感器数据到SD卡", "MESSAGE");
            await openEarable.sensorRecorder.pauseRecordingToSD();
            this.updateUI();
        } catch (error) {
            SDRecordingErrorHandler.handleRecordingStateError(error);
        }
    }

    /**
     * 恢复记录
     */
    async resumeRecording() {
        try {
            log("恢复记录传感器数据到SD卡", "MESSAGE");
            await openEarable.sensorRecorder.resumeRecordingToSD();
            this.updateUI();
        } catch (error) {
            SDRecordingErrorHandler.handleRecordingStateError(error);
        }
    }

    /**
     * 获取选中的传感器类型
     */
    getSelectedSensorTypes() {
        const sensorTypes = [];
        
        // 检查压力传感器
        if ($('#sdRecordPressure').is(':checked')) {
            sensorTypes.push(SENSOR_ID.PRESSURE_SENSOR);
        }
        
        // 检查温度传感器（注意：温度和压力传感器在OpenEarable中是同一个传感器，但数据不同）
        if ($('#sdRecordTemperature').is(':checked')) {
            // 如果压力传感器已经添加，不要重复添加
            if (!sensorTypes.includes(SENSOR_ID.PRESSURE_SENSOR)) {
                sensorTypes.push(SENSOR_ID.PRESSURE_SENSOR);
            }
        }
        
        // 检查IMU传感器
        if ($('#sdRecordIMU').is(':checked')) {
            sensorTypes.push(SENSOR_ID.IMU);
        }
        
        return sensorTypes;
    }

    /**
     * 更新UI状态
     */
    updateUI() {
        try {
            const statusText = this.getStatusText();
            const statusClass = this.getStatusClass();
            
            // 更新状态显示
            $('#sdStatusText').text(statusText);
            $('#sdRecordingStatus').removeClass('alert-info alert-success alert-warning alert-danger')
                                   .addClass(statusClass)
                                   .show();

            // 更新按钮状态
            this.updateButtonStates();
            
            // 更新开始按钮状态（检查传感器选择）
            this.updateStartButtonState();
        } catch (error) {
            console.error("更新UI状态时出错:", error);
        }
    }

    /**
     * 获取状态文本
     */
    getStatusText() {
        switch (this.recordingState) {
            case RECORDING_STATE.IDLE:
                return '空闲';
            case RECORDING_STATE.RECORDING:
                return '正在记录...';
            case RECORDING_STATE.PAUSED:
                return '已暂停';
            case RECORDING_STATE.STOPPED:
                return '已停止';
            case RECORDING_STATE.ERROR:
                return '错误';
            default:
                return '未知状态';
        }
    }

    /**
     * 获取状态样式类
     */
    getStatusClass() {
        switch (this.recordingState) {
            case RECORDING_STATE.IDLE:
                return 'alert-info';
            case RECORDING_STATE.RECORDING:
                return 'alert-success';
            case RECORDING_STATE.PAUSED:
                return 'alert-warning';
            case RECORDING_STATE.STOPPED:
                return 'alert-info';
            case RECORDING_STATE.ERROR:
                return 'alert-danger';
            default:
                return 'alert-info';
        }
    }

    /**
     * 更新按钮状态
     */
    updateButtonStates() {
        const isRecording = this.recordingState === RECORDING_STATE.RECORDING;
        const isPaused = this.recordingState === RECORDING_STATE.PAUSED;
        const isIdle = this.recordingState === RECORDING_STATE.IDLE;
        const isStopped = this.recordingState === RECORDING_STATE.STOPPED;

        // 开始记录按钮
        $('#startSDRecordingButton').prop('disabled', !isIdle && !isStopped).toggle(!isRecording && !isPaused);
        
        // 暂停按钮
        $('#pauseSDRecordingButton').prop('disabled', !isRecording).toggle(isRecording);
        
        // 恢复按钮
        $('#resumeSDRecordingButton').prop('disabled', !isPaused).toggle(isPaused);
        
        // 停止按钮
        $('#stopSDRecordingButton').prop('disabled', !isRecording && !isPaused).toggle(isRecording || isPaused);
    }

    /**
     * 更新开始按钮状态
     */
    updateStartButtonState() {
        const hasSelectedSensors = this.getSelectedSensorTypes().length > 0;
        $('#startSDRecordingButton').prop('disabled', !hasSelectedSensors || !this.isConnected);
    }

    /**
     * 启用控件
     */
    enableControls() {
        $('.is-connect-enabled').prop('disabled', false);
        this.updateStartButtonState();
    }

    /**
     * 禁用控件
     */
    disableControls() {
        $('.is-connect-enabled').prop('disabled', true);
    }

    /**
     * 重置记录状态
     */
    resetRecordingState() {
        this.recordingState = RECORDING_STATE.IDLE;
        this.currentConfig = null;
        
        // 清理UI状态
        $('#sdRecordingStatus').hide();
        $('#startSDRecordingButton').show().prop('disabled', true);
        $('#pauseSDRecordingButton').hide();
        $('#resumeSDRecordingButton').hide();
        $('#stopSDRecordingButton').hide();
        
        // 重置表单
        $('#sdRecordPressure').prop('checked', false);
        $('#sdRecordTemperature').prop('checked', false);
        $('#sdRecordIMU').prop('checked', false);
        $('#sdFileName').val('');
        
        this.updateUI();
    }
}

// 创建全局实例
let sdRecordingManager;

// 页面加载完成后初始化
$(document).ready(function() {
    sdRecordingManager = new SDRecordingManager();
});
