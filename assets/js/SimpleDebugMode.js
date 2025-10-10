/**
 * 简单调试模式 - 无需复杂配置
 * 直接模拟设备连接状态，启用所有控制面板
 */

class SimpleDebugMode {
    constructor() {
        this.isDebugMode = false;
        this.isConnected = false;
        this.originalConnectHandler = null;
        this.originalDisconnectHandler = null;
        
        this.init();
    }
    
    init() {
        // 检查URL参数
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('debug') === 'true') {
            this.enableDebugMode();
        }
        
        // 创建调试按钮
        this.createDebugButton();
    }
    
    createDebugButton() {
        const debugButton = document.createElement('button');
        debugButton.id = 'simpleDebugToggle';
        debugButton.className = 'btn btn-warning position-fixed';
        debugButton.style.cssText = 'top: 10px; right: 10px; z-index: 9999; font-size: 0.8em; padding: 5px 10px;';
        debugButton.innerHTML = '🔧 调试模式';
        debugButton.title = '点击启用/禁用调试模式';
        
        debugButton.addEventListener('click', () => {
            this.toggleDebugMode();
        });
        
        document.body.appendChild(debugButton);
    }
    
    toggleDebugMode() {
        if (this.isDebugMode) {
            this.disableDebugMode();
        } else {
            this.enableDebugMode();
        }
    }
    
    enableDebugMode() {
        this.isDebugMode = true;
        
        // 更新按钮状态
        const button = document.getElementById('simpleDebugToggle');
        if (button) {
            button.innerHTML = '🔧 调试模式 (ON)';
            button.className = 'btn btn-success position-fixed';
        }
        
        // 显示调试指示器
        this.showDebugIndicator();
        
        // 模拟设备连接
        this.simulateDeviceConnection();
        
        log('🔧 调试模式已启用', 'SUCCESS');
    }
    
    disableDebugMode() {
        this.isDebugMode = false;
        
        // 更新按钮状态
        const button = document.getElementById('simpleDebugToggle');
        if (button) {
            button.innerHTML = '🔧 调试模式';
            button.className = 'btn btn-warning position-fixed';
        }
        
        // 隐藏调试指示器
        this.hideDebugIndicator();
        
        // 恢复原始连接状态
        this.restoreOriginalState();
        
        log('🔧 调试模式已禁用', 'MESSAGE');
    }
    
    simulateDeviceConnection() {
        // 直接模拟设备已连接状态
        this.isConnected = true;
        
        // 更新UI状态
        $('#connectDeviceButton').hide();
        $('#disconnectDeviceButton').show();
        $(".is-connect-enabled").prop('disabled', false);
        
        // 更新设备信息
        $('#connectedDevice').text('OpenEarable-DEBUG');
        $('#fwVersion').text('1.4.0');
        $('#deviceVersion').text('1.4.0');
        $('#batteryLevel').text('85');
        
        // 模拟电池状态
        $('#batteryChargingIndicator').hide();
        $('#batteryChargedIndicator').hide();
        
        log('模拟设备已连接 - 所有控制面板已启用', 'SUCCESS');
        
        // 启动模拟数据生成
        this.startMockDataGeneration();
    }
    
    startMockDataGeneration() {
        // 简单的模拟数据生成
        this.mockDataInterval = setInterval(() => {
            if (this.isDebugMode && this.isConnected) {
                // 生成简单的模拟数据
                this.generateMockSensorData();
            }
        }, 100); // 10Hz
    }
    
    generateMockSensorData() {
        // 生成简单的模拟传感器数据
        const timestamp = Date.now();
        const mockData = {
            sensorId: 0,
            timestamp: timestamp,
            sensorName: "IMU",
            ACC: {
                X: (Math.random() - 0.5) * 2,
                Y: (Math.random() - 0.5) * 2,
                Z: -9.81 + (Math.random() - 0.5) * 0.5
            },
            GYRO: {
                X: (Math.random() - 0.5) * 10,
                Y: (Math.random() - 0.5) * 10,
                Z: (Math.random() - 0.5) * 10
            },
            MAG: {
                X: 25 + (Math.random() - 0.5) * 5,
                Y: (Math.random() - 0.5) * 5,
                Z: (Math.random() - 0.5) * 5
            }
        };
        
        // 触发传感器数据事件
        if (window.openEarable && window.openEarable.sensorManager) {
            // 模拟传感器数据接收
            if (window.openEarable.sensorManager.onSensorDataReceivedSubscriber) {
                window.openEarable.sensorManager.onSensorDataReceivedSubscriber.forEach(callback => {
                    callback(mockData);
                });
            }
        }
    }
    
    showDebugIndicator() {
        // 移除现有指示器
        this.hideDebugIndicator();
        
        // 创建调试指示器
        const indicator = document.createElement('div');
        indicator.id = 'debugIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            background: #28a745;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 0.8em;
            z-index: 9998;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        `;
        indicator.innerHTML = '🔧 调试模式 - 模拟设备已连接';
        document.body.appendChild(indicator);
    }
    
    hideDebugIndicator() {
        const indicator = document.getElementById('debugIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    restoreOriginalState() {
        // 恢复原始状态
        this.isConnected = false;
        
        // 恢复UI状态
        $('#connectDeviceButton').show();
        $('#disconnectDeviceButton').hide();
        $(".is-connect-enabled").prop('disabled', true);
        
        // 恢复默认设备信息
        $('#connectedDevice').text('OpenEarable-XXXX');
        $('#fwVersion').text('X.X.X');
        $('#deviceVersion').text('X.X.X');
        $('#batteryLevel').text('XX');
        
        // 停止模拟数据生成
        if (this.mockDataInterval) {
            clearInterval(this.mockDataInterval);
            this.mockDataInterval = null;
        }
    }
    
    // 模拟设备断开连接
    simulateDisconnect() {
        if (this.isDebugMode) {
            this.restoreOriginalState();
            log('模拟设备已断开', 'WARNING');
        }
    }
    
    // 模拟按钮按下
    simulateButtonPress() {
        if (this.isDebugMode && this.isConnected) {
            // 触发按钮事件
            if (window.openEarable && window.openEarable.buttonManager) {
                // 模拟按钮状态变化
                if (window.openEarable.buttonManager.buttonStateChangedSubscribers) {
                    window.openEarable.buttonManager.buttonStateChangedSubscribers.forEach(callback => {
                        callback(1); // 按下
                        setTimeout(() => callback(0), 200); // 释放
                    });
                }
            }
        }
    }
}

// 全局简单调试模式实例
window.simpleDebugMode = new SimpleDebugMode();

// 重写连接按钮事件
$(document).ready(function() {
    // 保存原始连接处理函数
    const originalConnectClick = $('#connectDeviceButton').off('click').on('click', async function() {
        if (window.simpleDebugMode.isDebugMode) {
            // 调试模式下直接模拟连接
            window.simpleDebugMode.simulateDeviceConnection();
        } else {
            // 正常模式下的连接逻辑
            $('#connectDeviceButton').prop('disabled', true);
            log("Scanning for OpenEarables. Please select.", type = "MESSAGE")
            try {
                await openEarable.bleManager.connect();
            } catch (e) {
                $('#connectDeviceButton').prop('disabled', false);
            }
        }
    });
    
    // 重写断开连接事件
    $('#disconnectDeviceButton').off('click').on('click', function() {
        if (window.simpleDebugMode.isDebugMode) {
            // 调试模式下模拟断开
            window.simpleDebugMode.simulateDisconnect();
        } else {
            // 正常模式下的断开逻辑
            $(".is-connect-enabled").prop('disabled', true);
            $('#disconnectDeviceButton').prop('disabled', true);
            log("Disconnecting OpenEarable.", type = "MESSAGE")
            openEarable.bleManager.disconnect();
        }
    });
});
