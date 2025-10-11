/**
 * SD卡记录管理器
 * 处理传感器数据直接记录到OpenEarable设备SD卡的功能
 * 简化版本：只提供核心记录功能，不包含UI控制
 */
class SDRecordingManager {
    constructor() {
        this.isConnected = false;
        this.recordingState = RECORDING_STATE.IDLE;
        this.currentConfig = null;
        
        // 订阅连接状态变化
        if (typeof openEarable !== 'undefined') {
            openEarable.bleManager.subscribeOnConnected(() => {
                this.isConnected = true;
                this.initializeSDRecording();
            });
            
            openEarable.bleManager.subscribeOnDisconnected(() => {
                this.isConnected = false;
                this.resetRecordingState();
            });
        }
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
     * 开始记录（简化版本，由RecordingManager调用）
     */
    async startRecording(sensorTypes, dataFormat, fileName, samplingRate) {
        try {
            // 验证输入参数
            if (!this.validateRecordingParameters(sensorTypes, dataFormat, fileName, samplingRate)) {
                return false;
            }

            log(`开始记录传感器数据到SD卡: ${sensorTypes.join(', ')}`, "MESSAGE");
            
            await openEarable.sensorRecorder.startRecordingToSD(
                sensorTypes,
                dataFormat,
                fileName,
                samplingRate
            );

            return true;
        } catch (error) {
            log("开始记录失败: " + error.message, "ERROR");
            return false;
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
     * 停止记录（简化版本）
     */
    async stopRecording() {
        try {
            log("停止记录传感器数据到SD卡", "MESSAGE");
            await openEarable.sensorRecorder.stopRecordingToSD();
            return true;
        } catch (error) {
            log("停止记录失败: " + error.message, "ERROR");
            return false;
        }
    }

    /**
     * 重置记录状态（简化版本）
     */
    resetRecordingState() {
        this.recordingState = RECORDING_STATE.IDLE;
        this.currentConfig = null;
    }
}

// 创建全局实例
let sdRecordingManager;

// 页面加载完成后初始化
$(document).ready(function() {
    sdRecordingManager = new SDRecordingManager();
});
