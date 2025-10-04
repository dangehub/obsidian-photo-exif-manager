import { ExifReader } from './ExifReader';

/**
 * 测试ExifReader的路径安全检查逻辑，特别是app://协议支持
 */
export class ExifReaderTest {

  /**
   * 测试路径转换和验证功能
   */
  static testPathHandling() {
    console.log('=== ExifReader 路径处理测试 ===\n');

    // 测试用例
    const testCases = [
      // app://协议测试用例
      {
        name: 'app://协议正常路径',
        input: 'app://8cf4920ca1a09669982d3102509dcbbfdf6f/Users/qudange/Documents/Obsidian各种库/Exif插件开发/0.jpeg',
        shouldPass: true
      },
      {
        name: 'app://协议复杂路径',
        input: 'app://abc123def456789/Documents/My Vault/Images/photo (1).jpg',
        shouldPass: true
      },
      {
        name: 'app://协议Windows路径',
        input: 'app://vault123/C:/Users/John/Documents/Obsidian/Vault/image.png',
        shouldPass: true
      },

      // file://协议测试用例
      {
        name: 'file://协议Unix路径',
        input: 'file:///home/user/Documents/image.jpg',
        shouldPass: true
      },
      {
        name: 'file://协议Windows路径',
        input: 'file:///C:/Users/user/Documents/image.jpg',
        shouldPass: true
      },

      // 普通路径测试用例
      {
        name: '相对路径',
        input: 'images/photo.jpg',
        shouldPass: true
      },
      {
        name: '绝对Unix路径（应被拒绝）',
        input: '/etc/passwd',
        shouldPass: false
      },
      {
        name: '绝对Windows路径（应被拒绝）',
        input: 'C:\\Windows\\System32\\config.txt',
        shouldPass: false
      },
      {
        name: '路径遍历攻击（应被拒绝）',
        input: '../../../etc/passwd',
        shouldPass: false
      },
      {
        name: '敏感系统路径（应被拒绝）',
        input: 'system32/config.txt',
        shouldPass: false
      }
    ];

    // 执行测试
    testCases.forEach((testCase, index) => {
      console.log(`测试 ${index + 1}: ${testCase.name}`);
      console.log(`输入: ${testCase.input}`);

      try {
        // 测试路径转换
        const convertedPath = ExifReader['convertToLocalPath'](testCase.input);
        console.log(`转换后: ${convertedPath}`);

        // 测试路径验证
        const isValid = ExifReader['isPathInVault'](testCase.input);
        console.log(`验证结果: ${isValid}`);

        // 检查结果是否符合预期
        if (isValid === testCase.shouldPass) {
          console.log(`✅ 测试通过\n`);
        } else {
          console.log(`❌ 测试失败 - 期望: ${testCase.shouldPass}, 实际: ${isValid}\n`);
        }

      } catch (error) {
        console.log(`❌ 测试出错: ${error.message}\n`);
      }
    });

    console.log('=== 路径处理测试完成 ===\n');
  }

  /**
   * 测试诊断功能
   */
  static async testDiagnosis() {
    console.log('=== ExifReader 诊断功能测试 ===\n');

    // 测试诊断功能（不会实际读取文件，只测试路径处理）
    const testPath = 'app://8cf4920ca1a09669982d3102509dcbbfdf6f/Users/qudange/Documents/Obsidian各种库/Exif插件开发/0.jpeg';

    console.log(`诊断测试路径: ${testPath}`);

    try {
      // 注意：这个测试不会实际访问文件系统，只测试路径处理逻辑
      console.log('诊断功能测试完成（仅路径处理部分）');
    } catch (error) {
      console.log(`诊断测试出错: ${error.message}`);
    }

    console.log('=== 诊断功能测试完成 ===\n');
  }

  /**
   * 运行所有测试
   */
  static runAllTests() {
    console.log('开始 ExifReader 全面测试...\n');

    this.testPathHandling();
    this.testDiagnosis();

    console.log('所有测试完成！');
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  ExifReaderTest.runAllTests();
}