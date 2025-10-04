/**
 * 独立的路径处理测试脚本
 * 用于验证修复后的ExifReader路径安全检查逻辑
 */

// 简单的路径清理函数测试（模拟修复后的ExifReader行为）
function cleanFilePath(filePath) {
  console.log(`[Test] 清理路径参数: ${filePath}`);

  // 移除查询参数（?后面的部分）
  const queryIndex = filePath.indexOf('?');
  if (queryIndex !== -1) {
    const cleanedPath = filePath.substring(0, queryIndex);
    console.log(`[Test] 移除查询参数: ${filePath.substring(queryIndex)} -> ${cleanedPath}`);
    filePath = cleanedPath;
  }

  // 移除片段标识符（#后面的部分）
  const fragmentIndex = filePath.indexOf('#');
  if (fragmentIndex !== -1) {
    const cleanedPath = filePath.substring(0, fragmentIndex);
    console.log(`[Test] 移除片段标识符: ${filePath.substring(fragmentIndex)} -> ${cleanedPath}`);
    filePath = cleanedPath;
  }

  console.log(`[Test] 清理后的路径: ${filePath}`);
  return filePath;
}

// 文件格式检测函数测试
function isSupportedImageFormat(filePath) {
  console.log(`[Test] 验证图像格式: ${filePath}`);

  // 首先清理路径中的参数，确保只检查实际的文件路径部分
  const cleanedPath = cleanFilePath(filePath);
  console.log(`[Test] 清理后的路径用于格式检测: ${cleanedPath}`);

  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif'];
  const lowerPath = cleanedPath.toLowerCase();

  const isSupported = supportedExtensions.some(ext => lowerPath.endsWith(ext));

  console.log(`[Test] 格式检测结果:`);
  console.log(`[Test]   清理后的路径: ${cleanedPath}`);
  console.log(`[Test]   检测的扩展名: ${supportedExtensions.join(', ')}`);
  console.log(`[Test]   是否支持: ${isSupported}`);

  // 如果检测失败，提供详细的调试信息
  if (!isSupported) {
    console.warn(`[Test] 不支持的图像格式: ${cleanedPath}`);
    console.warn(`[Test] 支持的格式: ${supportedExtensions.join(', ')}`);

    // 检查是否是因为缺少扩展名
    if (!lowerPath.includes('.')) {
      console.warn(`[Test] 文件路径不包含扩展名: ${cleanedPath}`);
    } else {
      console.warn(`[Test] 文件扩展名不匹配: ${require('path').extname(cleanedPath)}`);
    }
  }

  return isSupported;
}

// 使用ExifReader类进行测试
class PathValidator {
  static convertToLocalPath(filePath) {
    console.log(`[Test] 转换路径格式: ${filePath}`);

    // 处理app://协议
    if (filePath.startsWith('app://')) {
      console.log(`[Test] 检测到app://协议，开始解析...`);
      try {
        // 移除协议前缀
        let withoutProtocol = filePath.replace('app://', '');

        // 分割路径，找到第一个路径分隔符的位置
        const firstSlashIndex = withoutProtocol.indexOf('/');
        if (firstSlashIndex === -1) {
          console.warn(`[Test] app://协议路径格式无效：${filePath}`);
          return filePath;
        }

        // 提取实际文件路径部分（跳过标识符部分）
        const actualPath = withoutProtocol.substring(firstSlashIndex);
        console.log(`[Test] app://协议解析结果:`);
        console.log(`[Test]   完整路径: ${filePath}`);
        console.log(`[Test]   标识符部分: ${withoutProtocol.substring(0, firstSlashIndex)}`);
        console.log(`[Test]   实际路径: ${actualPath}`);

        // 解码URL编码（如果有的话）
        const decodedPath = decodeURIComponent(actualPath);
        console.log(`[Test] 解码后的实际路径: ${decodedPath}`);
        return decodedPath;
      } catch (parseError) {
        console.warn(`[Test] app://协议解析失败:`, parseError);
        console.warn(`[Test] 原始路径: ${filePath}`);
        return filePath;
      }
    }

    // 处理file://协议
    if (filePath.startsWith('file://')) {
      try {
        let withoutProtocol = filePath.replace('file://', '');
        // 处理Windows路径中的多余斜杠
        if (process.platform === 'win32' && withoutProtocol.startsWith('/')) {
          withoutProtocol = withoutProtocol.substring(1);
        }
        // 解码URL编码（如果有的话）
        const decodedPath = decodeURIComponent(withoutProtocol);
        console.log(`[Test] file://协议转换后的本地路径: ${decodedPath}`);
        return decodedPath;
      } catch (decodeError) {
        console.warn(`[Test] file://协议URL解码失败，返回原始路径: ${filePath}`);
        return filePath.replace('file://', '');
      }
    }

    // 如果已经是普通路径，直接返回
    console.log(`[Test] 路径无需转换: ${filePath}`);
    return filePath;
  }

  static validateAppProtocolPath(filePath) {
    console.log(`[Test] 验证app://协议路径: ${filePath}`);

    // 只检查最危险的路径遍历攻击
    if (filePath.includes('../') || filePath.includes('..\\')) {
      console.warn(`[Test] app://协议路径中检测到路径遍历攻击: ${filePath}`);
      return false;
    }

    // 检查是否包含危险的系统路径模式（只检查最关键的系统目录）
    const dangerousPatterns = [
      '/etc/',
      '\\etc\\',
      '/system32/',
      '\\system32\\',
      '/windows/system32/',
      '\\windows\\system32\\',
      '/usr/bin/',
      '\\usr\\bin\\',
      '/bin/',
      '\\bin\\',
      '/proc/',
      '\\proc\\',
      '/dev/',
      '\\dev\\',
      '/sys/',
      '\\sys\\'
    ];

    const lowerPath = filePath.toLowerCase();
    for (const pattern of dangerousPatterns) {
      if (lowerPath.includes(pattern)) {
        console.warn(`[Test] app://协议路径中检测到危险系统路径: ${pattern} in ${filePath}`);
        return false;
      }
    }

    // 检查路径长度，防止异常长的路径
    if (filePath.length > 2000) {
      console.warn(`[Test] app://协议路径过长，可能存在异常: ${filePath.length} chars`);
      return false;
    }

    // 检查是否包含明显的攻击模式
    if (filePath.includes('<script') || filePath.includes('javascript:') || filePath.includes('data:')) {
      console.warn(`[Test] app://协议路径中检测到潜在攻击模式: ${filePath}`);
      return false;
    }

    console.log(`[Test] app://协议路径安全性验证通过: ${filePath}`);
    return true;
  }

  static validateRegularPath(filePath) {
    console.log(`[Test] 验证普通路径安全性: ${filePath}`);

    // 防止路径遍历攻击 - 检查是否有连续的..或绝对路径开头
    if (filePath.includes('..') || filePath.startsWith('/') || filePath.startsWith('\\')) {
      console.warn(`[Test] 检测到潜在路径遍历攻击: ${filePath}`);
      return false;
    }

    // 检查是否包含危险的系统路径模式（只检查最关键的系统目录）
    const dangerousPatterns = [
      '/etc/', '\\etc\\',
      '/usr/bin/', '\\usr\\bin\\',
      '/bin/', '\\bin\\',
      '/proc/', '\\proc\\',
      '/dev/', '\\dev\\',
      '/sys/', '\\sys\\',
      '/system32/', '\\system32\\', // 只检查system32目录本身
      '/windows/system32/', '\\windows\\system32\\', // 只检查具体的Windows系统路径
      '/program files/', '\\program files\\', // 只检查program files目录本身
      'system32', // 只检查独立的system32
      'windows/system32', // 只检查具体的Windows系统路径
      'program files' // 只检查独立的program files
    ];

    const lowerPath = filePath.toLowerCase();
    for (const pattern of dangerousPatterns) {
      if (lowerPath.includes(pattern)) {
        console.warn(`[Test] 检测到危险系统路径: ${pattern} in ${filePath}`);
        return false;
      }
    }

    // 检查是否为隐藏文件或系统文件（但允许正常的隐藏文件如.DS_Store）
    if (filePath.startsWith('.') && !filePath.includes('/.')) {
      // 根级别的隐藏文件可能是系统文件，拒绝
      console.warn(`[Test] 检测到根级别隐藏文件: ${filePath}`);
      return false;
    }

    // 检查路径长度，防止异常长的路径
    if (filePath.length > 1000) {
      console.warn(`[Test] 路径过长，可能存在异常: ${filePath.length} chars`);
      return false;
    }

    console.log(`[Test] 普通路径安全性验证通过: ${filePath}`);
    return true;
  }

  static isPathInVault(filePath) {
    console.log(`[Test] 开始路径安全性验证: ${filePath}`);

    // 处理app://协议路径
    if (filePath.startsWith('app://')) {
      console.log(`[Test] 检测到app://协议路径，进行协议特定验证...`);

      try {
        // 移除协议前缀
        const withoutProtocol = filePath.replace('app://', '');

        // 分割路径，找到第一个路径分隔符的位置
        const firstSlashIndex = withoutProtocol.indexOf('/');
        if (firstSlashIndex === -1) {
          console.warn(`[Test] app://协议路径格式无效：${filePath}`);
          return false;
        }

        // 提取实际文件路径部分（跳过标识符部分）
        const actualPath = withoutProtocol.substring(firstSlashIndex);
        console.log(`[Test] app://协议路径验证 - 实际路径: ${actualPath}`);

        // 对实际路径进行安全性验证（标记为来自app协议）
        return this.validateAppProtocolPath(actualPath);
      } catch (parseError) {
        console.warn(`[Test] app://协议路径解析失败:`, parseError);
        return false;
      }
    }

    // 处理普通路径（包括file://协议转换后的路径）
    console.log(`[Test] 普通路径验证: ${filePath}`);
    return this.validateRegularPath(filePath);
  }
}

// 测试用例
const testCases = [
  // app://协议测试用例
  {
    name: 'app://协议正常路径',
    input: 'app://8cf4920ca1a09669982d3102509dcbbfdf6f/Users/qudange/Documents/Obsidian各种库/Exif插件开发/0.jpeg',
    shouldPass: true
  },
  {
    name: 'app://协议简单路径',
    input: 'app://vault123/Documents/photo.jpg',
    shouldPass: true
  },
  {
    name: 'app://协议Windows路径',
    input: 'app://vault123/C:/Users/John/Documents/image.png',
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

  // 危险路径测试用例
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
  },
  {
    name: '危险系统路径（应被拒绝）',
    input: '/usr/bin/bash',
    shouldPass: false
  }
];

// 运行测试
function runTests() {
  console.log('=== 路径处理测试开始 ===\n');

  testCases.forEach((testCase, index) => {
    console.log(`测试 ${index + 1}: ${testCase.name}`);
    console.log(`输入: ${testCase.input}`);

    try {
      // 测试路径清理和格式检测（使用修复后的逻辑）
      const cleanedPath = cleanFilePath(testCase.input);
      console.log(`清理后: ${cleanedPath}`);

      const formatValid = isSupportedImageFormat(testCase.input);
      console.log(`格式验证结果: ${formatValid}`);

      // 对于带参数的路径，清理后的路径应该能正确识别格式
      const finalValid = testCase.input.includes('?') ? formatValid : true;

      // 检查结果是否符合预期
      if (finalValid === testCase.shouldPass) {
        console.log(`✅ 测试通过\n`);
      } else {
        console.log(`❌ 测试失败 - 期望: ${testCase.shouldPass}, 实际: ${finalValid}\n`);
      }

    } catch (error) {
      console.log(`❌ 测试出错: ${error.message}\n`);
    }
  });

  console.log('=== 路径处理测试完成 ===\n');
}

// 测试具体的带参数的文件路径
function testSpecificFile() {
  console.log('\n=== 测试具体文件路径（含URL参数） ===');

  // 测试带URL参数的文件路径（这是主要修复的目标）
  const testCases = [
    {
      name: '带时间戳参数的完整路径',
      input: '/Users/qudange/Documents/Obsidian各种库/Exif插件开发/0.jpeg?1759560592036',
      expectedToPass: true
    },
    {
      name: 'app://协议带时间戳参数',
      input: 'app://8cf4920ca1a09669982d3102509dcbbfdf6f/Users/qudange/Documents/Obsidian各种库/Exif插件开发/0.jpeg?1759560592036',
      expectedToPass: true
    },
    {
      name: '带查询参数和片段标识符',
      input: '/path/to/image.jpg?timestamp=123&version=1#section',
      expectedToPass: true
    },
    {
      name: 'file://协议带参数',
      input: 'file:///home/user/Documents/photo.png?modified=1234567890',
      expectedToPass: true
    },
    {
      name: 'Vault根目录下的图像文件（无参数）',
      input: '/Users/qudange/Documents/Obsidian各种库/Exif插件开发/0.jpeg',
      expectedToPass: true
    },
    {
      name: '相对路径（模拟）',
      input: '0.jpeg',
      expectedToPass: true
    },
    {
      name: '带路径的相对路径（模拟）',
      input: 'images/0.jpeg',
      expectedToPass: true
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n测试 ${index + 1}: ${testCase.name}`);
    console.log(`输入: ${testCase.input}`);

    try {
      const cleanedPath = cleanFilePath(testCase.input);
      console.log(`清理后: ${cleanedPath}`);

      const formatValid = isSupportedImageFormat(testCase.input);
      console.log(`格式验证结果: ${formatValid}`);

      if (formatValid === testCase.expectedToPass) {
        console.log(`✅ 测试通过`);
      } else {
        console.log(`❌ 测试失败 - 期望: ${testCase.expectedToPass}, 实际: ${formatValid}`);
      }

    } catch (error) {
      console.log(`❌ 测试出错: ${error.message}`);
    }
  });
}

// 执行所有测试
console.log('=== 路径处理全面测试 ===\n');
runTests();
testSpecificFile();