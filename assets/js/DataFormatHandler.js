/**
 * 数据格式处理器
 * 处理不同数据格式的转换和验证
 */
class DataFormatHandler {
    
    /**
     * 将传感器数据转换为CSV格式
     * @param {Array} sensorData - 传感器数据数组
     * @param {Array} sensorTypes - 传感器类型数组
     * @returns {string} CSV格式的字符串
     */
    static toCSV(sensorData, sensorTypes) {
        if (!sensorData || sensorData.length === 0) {
            return '';
        }

        // 生成CSV头部
        const headers = ['timestamp'];
        
        if (sensorTypes.includes(SENSOR_ID.IMU)) {
            headers.push(
                'acc_x', 'acc_y', 'acc_z',
                'gyro_x', 'gyro_y', 'gyro_z',
                'mag_x', 'mag_y', 'mag_z'
            );
        }
        
        if (sensorTypes.includes(SENSOR_ID.PRESSURE_SENSOR)) {
            headers.push('pressure', 'temperature');
        }

        // 生成CSV行
        const rows = sensorData.map(data => {
            const row = [data.timestamp];
            
            // 添加IMU数据（如果选择了IMU传感器且数据存在）
            if (sensorTypes.includes(SENSOR_ID.IMU)) {
                if (data.acc && data.acc.length === 3) {
                    row.push(data.acc[0], data.acc[1], data.acc[2]);
                } else {
                    row.push('', '', ''); // 空值占位
                }
                
                if (data.gyro && data.gyro.length === 3) {
                    row.push(data.gyro[0], data.gyro[1], data.gyro[2]);
                } else {
                    row.push('', '', ''); // 空值占位
                }
                
                if (data.mag && data.mag.length === 3) {
                    row.push(data.mag[0], data.mag[1], data.mag[2]);
                } else {
                    row.push('', '', ''); // 空值占位
                }
            }
            
            // 添加压力和温度数据（如果选择了压力传感器）
            if (sensorTypes.includes(SENSOR_ID.PRESSURE_SENSOR)) {
                row.push(data.pressure !== undefined ? data.pressure : '', 
                        data.temperature !== undefined ? data.temperature : '');
            }
            
            return row.join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * 将传感器数据转换为JSON格式
     * @param {Array} sensorData - 传感器数据数组
     * @param {Array} sensorTypes - 传感器类型数组
     * @returns {string} JSON格式的字符串
     */
    static toJSON(sensorData, sensorTypes) {
        const jsonData = {
            metadata: {
                sensorTypes: sensorTypes,
                dataCount: sensorData.length,
                timestamp: new Date().toISOString(),
                format: 'JSON'
            },
            data: sensorData.map(data => {
                const record = { timestamp: data.timestamp };
                
                if (sensorTypes.includes(SENSOR_ID.IMU)) {
                    record.imu = {};
                    
                    if (data.acc && data.acc.length === 3) {
                        record.imu.accelerometer = { x: data.acc[0], y: data.acc[1], z: data.acc[2] };
                    }
                    if (data.gyro && data.gyro.length === 3) {
                        record.imu.gyroscope = { x: data.gyro[0], y: data.gyro[1], z: data.gyro[2] };
                    }
                    if (data.mag && data.mag.length === 3) {
                        record.imu.magnetometer = { x: data.mag[0], y: data.mag[1], z: data.mag[2] };
                    }
                }
                
                if (sensorTypes.includes(SENSOR_ID.PRESSURE_SENSOR)) {
                    record.environmental = {
                        pressure: data.pressure,
                        temperature: data.temperature
                    };
                }
                
                return record;
            })
        };

        return JSON.stringify(jsonData, null, 2);
    }

    /**
     * 将传感器数据转换为二进制格式
     * @param {Array} sensorData - 传感器数据数组
     * @param {Array} sensorTypes - 传感器类型数组
     * @returns {Uint8Array} 二进制数据
     */
    static toBinary(sensorData, sensorTypes) {
        const buffer = [];
        
        // 写入头部信息
        buffer.push(sensorTypes.length); // 传感器类型数量
        sensorTypes.forEach(type => buffer.push(type));
        
        // 写入数据数量
        const dataCount = sensorData.length;
        buffer.push(dataCount & 0xFF, (dataCount >> 8) & 0xFF, (dataCount >> 16) & 0xFF, (dataCount >> 24) & 0xFF);
        
        // 写入传感器数据
        sensorData.forEach(data => {
            // 时间戳 (8字节)
            const timestamp = new Date(data.timestamp).getTime();
            for (let i = 0; i < 8; i++) {
                buffer.push((timestamp >> (i * 8)) & 0xFF);
            }
            
            // IMU数据 (36字节: 3个float * 3个传感器 * 4字节)
            if (sensorTypes.includes(SENSOR_ID.IMU)) {
                // 加速度计数据
                const accData = data.acc && data.acc.length === 3 ? data.acc : [0, 0, 0];
                accData.forEach(value => {
                    const bytes = new Float32Array([value]);
                    for (let i = 0; i < 4; i++) {
                        buffer.push(bytes[i]);
                    }
                });
                
                // 陀螺仪数据
                const gyroData = data.gyro && data.gyro.length === 3 ? data.gyro : [0, 0, 0];
                gyroData.forEach(value => {
                    const bytes = new Float32Array([value]);
                    for (let i = 0; i < 4; i++) {
                        buffer.push(bytes[i]);
                    }
                });
                
                // 磁力计数据
                const magData = data.mag && data.mag.length === 3 ? data.mag : [0, 0, 0];
                magData.forEach(value => {
                    const bytes = new Float32Array([value]);
                    for (let i = 0; i < 4; i++) {
                        buffer.push(bytes[i]);
                    }
                });
            }
            
            // 压力和温度数据 (8字节: 2个float * 4字节)
            if (sensorTypes.includes(SENSOR_ID.PRESSURE_SENSOR)) {
                const pressure = data.pressure || 0;
                const temperature = data.temperature || 0;
                [pressure, temperature].forEach(value => {
                    const bytes = new Float32Array([value]);
                    for (let i = 0; i < 4; i++) {
                        buffer.push(bytes[i]);
                    }
                });
            }
        });
        
        return new Uint8Array(buffer);
    }

    /**
     * 验证传感器数据
     * @param {Object} data - 传感器数据对象
     * @param {Array} sensorTypes - 传感器类型数组
     * @returns {Object} 验证结果
     */
    static validateSensorData(data, sensorTypes) {
        const errors = [];
        const warnings = [];

        // 检查时间戳
        if (!data.timestamp) {
            errors.push('缺少时间戳');
        }

        // 检查IMU数据
        if (sensorTypes.includes(SENSOR_ID.IMU)) {
            if (!data.acc || data.acc.length !== 3) {
                errors.push('加速度计数据无效');
            }
            if (!data.gyro || data.gyro.length !== 3) {
                errors.push('陀螺仪数据无效');
            }
            if (!data.mag || data.mag.length !== 3) {
                errors.push('磁力计数据无效');
            }
        }

        // 检查压力和温度数据
        if (sensorTypes.includes(SENSOR_ID.PRESSURE_SENSOR)) {
            if (data.pressure === undefined || data.pressure === null) {
                warnings.push('压力数据缺失');
            }
            if (data.temperature === undefined || data.temperature === null) {
                warnings.push('温度数据缺失');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    /**
     * 获取文件扩展名
     * @param {number} dataFormat - 数据格式类型
     * @returns {string} 文件扩展名
     */
    static getFileExtension(dataFormat) {
        switch (dataFormat) {
            case DATA_FORMAT.CSV:
                return '.csv';
            case DATA_FORMAT.JSON:
                return '.json';
            case DATA_FORMAT.BINARY:
                return '.bin';
            default:
                return '.dat';
        }
    }

    /**
     * 格式化数据大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化的大小字符串
     */
    static formatDataSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}

/**
 * 错误处理器
 * 处理SD卡记录过程中的各种错误
 */
class SDRecordingErrorHandler {
    
    /**
     * 处理BLE连接错误
     * @param {Error} error - 错误对象
     */
    static handleBLEError(error) {
        log(`BLE连接错误: ${error.message}`, "ERROR");
        
        // 根据错误类型提供不同的处理建议
        if (error.message.includes('not found')) {
            log("建议: 检查设备是否已连接", "WARNING");
        } else if (error.message.includes('timeout')) {
            log("建议: 检查设备是否在范围内", "WARNING");
        } else if (error.message.includes('permission')) {
            log("建议: 检查浏览器BLE权限", "WARNING");
        }
    }

    /**
     * 处理SD卡写入错误
     * @param {Error} error - 错误对象
     */
    static handleSDCardError(error) {
        log(`SD卡写入错误: ${error.message}`, "ERROR");
        
        if (error.message.includes('full')) {
            log("建议: SD卡空间不足，请清理或更换SD卡", "WARNING");
        } else if (error.message.includes('write protected')) {
            log("建议: SD卡写保护，请检查SD卡开关", "WARNING");
        } else if (error.message.includes('not mounted')) {
            log("建议: SD卡未正确插入，请检查SD卡连接", "WARNING");
        }
    }

    /**
     * 处理传感器数据错误
     * @param {Error} error - 错误对象
     */
    static handleSensorDataError(error) {
        log(`传感器数据错误: ${error.message}`, "ERROR");
        
        if (error.message.includes('invalid data')) {
            log("建议: 检查传感器配置和采样率设置", "WARNING");
        } else if (error.message.includes('sensor not available')) {
            log("建议: 检查传感器是否已启用", "WARNING");
        }
    }

    /**
     * 处理记录状态错误
     * @param {Error} error - 错误对象
     */
    static handleRecordingStateError(error) {
        log(`记录状态错误: ${error.message}`, "ERROR");
        
        if (error.message.includes('already recording')) {
            log("建议: 先停止当前记录再开始新记录", "WARNING");
        } else if (error.message.includes('not recording')) {
            log("建议: 先开始记录再执行此操作", "WARNING");
        }
    }

    /**
     * 通用错误处理
     * @param {Error} error - 错误对象
     * @param {string} context - 错误上下文
     */
    static handleGenericError(error, context) {
        log(`${context}错误: ${error.message}`, "ERROR");
        
        // 记录详细错误信息到控制台
        console.error(`${context}详细错误:`, error);
        
        // 根据错误类型提供通用建议
        if (error.message.includes('network')) {
            log("建议: 检查网络连接", "WARNING");
        } else if (error.message.includes('permission')) {
            log("建议: 检查浏览器权限设置", "WARNING");
        } else {
            log("建议: 重新连接设备或刷新页面", "WARNING");
        }
    }
}
