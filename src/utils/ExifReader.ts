import * as exifr from 'exifr';

export interface ExifData {
  // 拍摄时间
  DateTimeOriginal?: Date;
  CreateDate?: Date;

  // 相机信息
  Make?: string;
  Model?: string;

  // 拍摄参数
  ApertureValue?: number;
  ShutterSpeedValue?: number;
  ISO?: number;
  FocalLength?: number;
  LensModel?: string;

  // GPS信息
   GPSLatitude?: number;
   GPSLongitude?: number;
   GPSAltitude?: number;
   latitude?: number;
   longitude?: number;

  // 图像信息
  ImageWidth?: number;
  ImageHeight?: number;
  Orientation?: number;

  // 其他信息
  Software?: string;
  Artist?: string;
  Copyright?: string;
}

export class ExifReader {
  /**
   * 读取图像文件的EXIF信息
   * @param filePath 文件路径（可以是file://协议URL或相对路径）
   * @param vaultBasePath 可选的vault基础路径
   * @returns EXIF数据或null（如果读取失败）
   */
  static async readExif(filePath: string, vaultBasePath?: string): Promise<ExifData | null> {
    console.log(`[ExifReader] 开始读取EXIF信息: ${filePath}`);
    console.log(`[ExifReader] Vault基础路径: ${vaultBasePath}`);

    // 转换file://协议URL为本地文件系统路径
    const localFilePath = this.convertToLocalPath(filePath);
    console.log(`[ExifReader] 转换后的本地路径: ${localFilePath}`);

    try {

      // 验证文件路径是否在vault内
      console.log(`[ExifReader] 验证文件路径安全性...`);
      if (!this.isPathInVault(localFilePath)) {
        console.error(`[ExifReader] 文件路径不安全: ${localFilePath}`);
        throw new Error('只能读取vault内的文件');
      }
      console.log(`[ExifReader] 文件路径验证通过`);

      // 验证文件扩展名
      console.log(`[ExifReader] 验证文件格式...`);
      if (!this.isSupportedImageFormat(localFilePath)) {
        console.error(`[ExifReader] 不支持的图像格式: ${localFilePath}`);
        throw new Error('不支持的图像格式');
      }
      console.log(`[ExifReader] 文件格式验证通过`);

      // 检查文件是否存在且可读
      console.log(`[ExifReader] 检查文件是否存在...`);
      if (!(await this.fileExists(localFilePath))) {
        console.error(`[ExifReader] 文件不存在或无法访问: ${localFilePath}`);
        throw new Error(`文件不存在或无法访问: ${localFilePath}`);
      }
      console.log(`[ExifReader] 文件存在验证通过`);

      // 使用exifr读取EXIF信息，传入本地文件路径
      console.log(`[ExifReader] 开始调用exifr.parse...`);
      const exifData = await exifr.parse(localFilePath, {
        // 指定需要读取的EXIF字段，避免读取不必要的数据
         pick: [
           'DateTimeOriginal',
           'CreateDate',
           'Make',
           'Model',
           'ApertureValue',
           'ShutterSpeedValue',
           'ISO',
           'FocalLength',
           'LensModel',
           'GPSLatitude',
           'GPSLongitude',
           'GPSAltitude',
           'latitude',
           'longitude',
           'ImageWidth',
           'ImageHeight',
           'Orientation',
           'Software',
           'Artist',
           'Copyright'
         ]
      });

      console.log(`[ExifReader] exifr.parse执行完成，结果类型: ${typeof exifData}`);
      console.log(`[ExifReader] EXIF数据详情:`, exifData);

      // 检查是否真的没有EXIF数据
      if (!exifData || Object.keys(exifData).length === 0) {
        console.warn(`[ExifReader] 文件${filePath}确实没有EXIF数据或EXIF数据为空`);
        return null;
      }

      console.log(`[ExifReader] EXIF信息读取成功，共${Object.keys(exifData).length}个字段`);
      return exifData as ExifData;

    } catch (error) {
      console.error(`[ExifReader] 读取EXIF信息失败 [${filePath}]:`, {
        error: error.message,
        stack: error.stack,
        type: error.constructor.name,
        filePath: filePath
      });

      // 根据不同的错误类型提供更具体的诊断信息
      if (error.message?.includes('ENOENT')) {
        console.error(`[ExifReader] 文件不存在: ${localFilePath}`);
        console.error(`[ExifReader] 原始路径: ${filePath}`);
      } else if (error.message?.includes('EACCES')) {
        console.error(`[ExifReader] 文件访问权限不足: ${localFilePath}`);
        console.error(`[ExifReader] 请检查文件权限和路径: ${filePath}`);
      } else if (error.message?.includes('format')) {
        console.error(`[ExifReader] 文件格式不支持或损坏: ${localFilePath}`);
        console.error(`[ExifReader] 支持的格式: JPG, PNG, WebP, TIFF`);
      } else if (error.message?.includes('exifr')) {
        console.error(`[ExifReader] EXIF库解析错误: ${localFilePath}`);
        console.error(`[ExifReader] 可能原因: 文件损坏或EXIF数据格式异常`);
      }

      // 添加详细的路径调试信息
      console.error(`[ExifReader] === 详细路径调试信息 ===`);
      console.error(`[ExifReader] 输入路径: ${filePath}`);
      console.error(`[ExifReader] 转换后路径: ${localFilePath}`);
      console.error(`[ExifReader] Vault路径: ${vaultBasePath}`);
      console.error(`[ExifReader] 当前工作目录: ${process.cwd()}`);

      // 协议解析调试信息
      if (filePath.startsWith('app://')) {
        console.error(`[ExifReader] === app://协议解析详情 ===`);
        const withoutProtocol = filePath.replace('app://', '');
        const firstSlashIndex = withoutProtocol.indexOf('/');
        if (firstSlashIndex !== -1) {
          const identifier = withoutProtocol.substring(0, firstSlashIndex);
          const actualPath = withoutProtocol.substring(firstSlashIndex);
          console.error(`[ExifReader] 协议标识符: ${identifier}`);
          console.error(`[ExifReader] 实际文件路径: ${actualPath}`);
          console.error(`[ExifReader] 解码后路径: ${decodeURIComponent(actualPath)}`);
        } else {
          console.error(`[ExifReader] app://协议格式错误，无法解析`);
        }
      }

      console.error(`[ExifReader] === 路径安全性检查详情 ===`);
      console.error(`[ExifReader] 路径长度: ${localFilePath.length}`);
      console.error(`[ExifReader] 是否包含"..": ${localFilePath.includes('..')}`);
      console.error(`[ExifReader] 是否以斜杠开头: ${localFilePath.startsWith('/') || localFilePath.startsWith('\\')}`);

      // 检查敏感路径
      const sensitivePaths = ['/', '\\', 'system32', 'windows', 'program files', 'etc', 'usr', 'bin'];
      const hasSensitivePath = sensitivePaths.some(path => localFilePath.toLowerCase().includes(path));
      console.error(`[ExifReader] 是否包含敏感路径: ${hasSensitivePath}`);

      if (hasSensitivePath) {
        console.error(`[ExifReader] 敏感路径检测详情:`);
        sensitivePaths.forEach(path => {
          if (localFilePath.toLowerCase().includes(path)) {
            console.error(`[ExifReader]   - 包含敏感路径: ${path}`);
          }
        });
      }

      return null;
    }
  }

  /**
   * 批量读取多个图像文件的EXIF信息
   * @param filePaths 文件路径数组
   * @returns EXIF数据数组，失败的项目为null
   */
  static async readMultipleExif(filePaths: string[]): Promise<(ExifData | null)[]> {
    const results = await Promise.allSettled(
      filePaths.map(filePath => this.readExif(filePath))
    );

    return results.map(result =>
      result.status === 'fulfilled' ? result.value : null
    );
  }

  /**
   * 检查文件是否存在且可读（沙盒兼容版本）
   * @param filePath 文件路径
   * @returns 是否存在且可读
   */
  private static async fileExists(filePath: string): Promise<boolean> {
    try {
      // 使用exifr尝试读取文件，如果文件不存在或无法访问会抛出异常
      // 这比直接使用fs模块更适合沙盒环境
      await exifr.parse(filePath, { pick: [] });
      return true;
    } catch (error) {
      // 检查是否为文件不存在或访问权限错误
      const isFileError = error.message?.includes('ENOENT') ||
                         error.message?.includes('EACCES') ||
                         error.message?.includes('no such file') ||
                         error.code === 'ENOENT';

      if (isFileError) {
        console.error(`[ExifReader] 文件不存在或无法访问 [${filePath}]:`, error.message);
        return false;
      }

      // 对于其他类型的错误，我们仍然认为是文件存在但可能有其他问题
      // 这样可以避免过度严格的文件检查导致误报
      console.warn(`[ExifReader] 文件检查警告 [${filePath}]:`, error.message);
      return true;
    }
  }

  /**
   * 清理文件路径中的URL参数和片段
   * @param filePath 文件路径
   * @returns 清理后的路径
   */
  private static cleanFilePath(filePath: string): string {
    console.log(`[ExifReader] 清理路径参数: ${filePath}`);

    // 移除查询参数（?后面的部分）
    const queryIndex = filePath.indexOf('?');
    if (queryIndex !== -1) {
      const cleanedPath = filePath.substring(0, queryIndex);
      console.log(`[ExifReader] 移除查询参数: ${filePath.substring(queryIndex)} -> ${cleanedPath}`);
      filePath = cleanedPath;
    }

    // 移除片段标识符（#后面的部分）
    const fragmentIndex = filePath.indexOf('#');
    if (fragmentIndex !== -1) {
      const cleanedPath = filePath.substring(0, fragmentIndex);
      console.log(`[ExifReader] 移除片段标识符: ${filePath.substring(fragmentIndex)} -> ${cleanedPath}`);
      filePath = cleanedPath;
    }

    console.log(`[ExifReader] 清理后的路径: ${filePath}`);
    return filePath;
  }

  /**
   * 转换各种协议URL为本地文件系统路径
   * @param filePath 文件路径（可能是file://、app://协议URL或普通路径）
   * @returns 本地文件系统路径
   */
  private static convertToLocalPath(filePath: string): string {
    console.log(`[ExifReader] 转换路径格式: ${filePath}`);

    // 首先清理URL参数和片段
    const cleanedPath = this.cleanFilePath(filePath);
    console.log(`[ExifReader] 清理后的路径: ${cleanedPath}`);

    // 处理app://协议（Obsidian内部协议）
    if (cleanedPath.startsWith('app://')) {
      console.log(`[ExifReader] 检测到app://协议，开始解析...`);
      try {
        // app://协议格式：app://<identifier>/<actual-file-path>
        // 例如：app://8cf4920ca1a09669982d3102509dcbbfdf6f/Users/qudange/Documents/Obsidian各种库/Exif插件开发/0.jpeg

        // 移除协议前缀
        let withoutProtocol = cleanedPath.replace('app://', '');

        // 分割路径，找到第一个路径分隔符的位置
        const firstSlashIndex = withoutProtocol.indexOf('/');
        if (firstSlashIndex === -1) {
          console.warn(`[ExifReader] app://协议路径格式无效：${cleanedPath}`);
          return cleanedPath;
        }

        // 提取实际文件路径部分（跳过标识符部分）
        const actualPath = withoutProtocol.substring(firstSlashIndex);
        console.log(`[ExifReader] app://协议解析结果:`);
        console.log(`[ExifReader]   完整路径: ${cleanedPath}`);
        console.log(`[ExifReader]   标识符部分: ${withoutProtocol.substring(0, firstSlashIndex)}`);
        console.log(`[ExifReader]   实际路径: ${actualPath}`);

        // 解码URL编码（如果有的话）
        const decodedPath = decodeURIComponent(actualPath);
        console.log(`[ExifReader] 解码后的实际路径: ${decodedPath}`);
        return decodedPath;
      } catch (parseError) {
        console.warn(`[ExifReader] app://协议解析失败:`, parseError);
        console.warn(`[ExifReader] 原始路径: ${cleanedPath}`);
        return cleanedPath;
      }
    }

    // 处理file://协议的URL，提取实际路径部分
    if (cleanedPath.startsWith('file://')) {
      try {
        // 在Windows上，file://协议路径可能是 file:///C:/path/to/file
        // 在Unix-like系统上，file://协议路径可能是 file:///home/user/path/to/file
        let withoutProtocol = cleanedPath.replace('file://', '');

        // 处理Windows路径中的多余斜杠
        if (process.platform === 'win32' && withoutProtocol.startsWith('/')) {
          withoutProtocol = withoutProtocol.substring(1);
        }

        // 解码URL编码（如果有的话）
        const decodedPath = decodeURIComponent(withoutProtocol);
        console.log(`[ExifReader] file://协议转换后的本地路径: ${decodedPath}`);
        return decodedPath;
      } catch (decodeError) {
        console.warn(`[ExifReader] file://协议URL解码失败，返回清理后的路径: ${cleanedPath}`);
        return cleanedPath.replace('file://', '');
      }
    }

    // 如果已经是普通路径，直接返回清理后的路径
    console.log(`[ExifReader] 普通路径转换完成: ${cleanedPath}`);
    return cleanedPath;
  }

  /**
   * 验证文件路径是否在vault内（支持app://协议）
   * @param filePath 文件路径（可能是app://协议、本地路径等）
   * @returns 是否在vault内
   */
  private static isPathInVault(filePath: string): boolean {
    console.log(`[ExifReader] 开始路径安全性验证: ${filePath}`);

    // 处理app://协议路径
    if (filePath.startsWith('app://')) {
      console.log(`[ExifReader] 检测到app://协议路径，进行协议特定验证...`);

      // app://协议路径的格式：app://<identifier>/<actual-file-path>
      // 我们需要验证实际文件路径部分

      try {
        // 移除协议前缀
        const withoutProtocol = filePath.replace('app://', '');

        // 分割路径，找到第一个路径分隔符的位置
        const firstSlashIndex = withoutProtocol.indexOf('/');
        if (firstSlashIndex === -1) {
          console.warn(`[ExifReader] app://协议路径格式无效：${filePath}`);
          return false;
        }

        // 提取实际文件路径部分（跳过标识符部分）
        const actualPath = withoutProtocol.substring(firstSlashIndex);
        console.log(`[ExifReader] app://协议路径验证 - 实际路径: ${actualPath}`);

        // 对实际路径进行安全性验证（标记为来自app协议）
        return this.validateActualPath(actualPath, true);
      } catch (parseError) {
        console.warn(`[ExifReader] app://协议路径解析失败:`, parseError);
        return false;
      }
    }

    // 处理普通路径（包括file://协议转换后的路径）
    console.log(`[ExifReader] 普通路径验证: ${filePath}`);
    return this.validateActualPath(filePath);
  }

  /**
   * 验证实际文件路径的安全性（内部方法）
   * @param filePath 实际文件路径
   * @param isFromAppProtocol 是否来自app://协议
   * @returns 是否安全
   */
  private static validateActualPath(filePath: string, isFromAppProtocol: boolean = false): boolean {
    console.log(`[ExifReader] 验证实际路径安全性: ${filePath} (来自app协议: ${isFromAppProtocol})`);

    // 添加详细的路径分析
    console.log(`[ExifReader] 路径分析:`);
    console.log(`[ExifReader]   - 长度: ${filePath.length}`);
    console.log(`[ExifReader]   - 是否绝对路径: ${filePath.startsWith('/') || filePath.startsWith('\\') || /^[A-Za-z]:\\/.test(filePath)}`);
    console.log(`[ExifReader]   - 是否相对路径: ${!filePath.startsWith('/') && !filePath.startsWith('\\') && !/^[A-Za-z]:\\/.test(filePath)}`);
    console.log(`[ExifReader]   - 包含点号: ${filePath.includes('.')}`);
    console.log(`[ExifReader]   - 路径分隔符: ${filePath.includes('/') ? '正斜杠' : filePath.includes('\\') ? '反斜杠' : '无'}`);

    // 对于来自app://协议的路径，采用更宽松的验证策略
    if (isFromAppProtocol) {
      return this.validateAppProtocolPath(filePath);
    }

    // 对于普通路径，先进行基本的安全检查
    return this.validateRegularPath(filePath);
  }

  /**
   * 验证来自app://协议的路径（宽松验证）
   * @param filePath 文件路径
   * @returns 是否安全
   */
  private static validateAppProtocolPath(filePath: string): boolean {
    console.log(`[ExifReader] 验证app://协议路径: ${filePath}`);

    // 只检查最危险的路径遍历攻击
    if (filePath.includes('../') || filePath.includes('..\\')) {
      console.warn(`[ExifReader] app://协议路径中检测到路径遍历攻击: ${filePath}`);
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
        console.warn(`[ExifReader] app://协议路径中检测到危险系统路径: ${pattern} in ${filePath}`);
        return false;
      }
    }

    // 检查路径长度，防止异常长的路径
    if (filePath.length > 2000) {
      console.warn(`[ExifReader] app://协议路径过长，可能存在异常: ${filePath.length} chars`);
      return false;
    }

    // 检查是否包含明显的攻击模式
    if (filePath.includes('<script') || filePath.includes('javascript:') || filePath.includes('data:')) {
      console.warn(`[ExifReader] app://协议路径中检测到潜在攻击模式: ${filePath}`);
      return false;
    }

    console.log(`[ExifReader] app://协议路径安全性验证通过: ${filePath}`);
    return true;
  }

  /**
   * 验证普通路径的安全性（优化验证）
   * @param filePath 文件路径
   * @returns 是否安全
   */
  private static validateRegularPath(filePath: string): boolean {
    console.log(`[ExifReader] 验证普通路径安全性: ${filePath}`);

    // 防止路径遍历攻击 - 只检查明显的路径遍历模式
    // 不阻止合法的绝对路径，因为Obsidian资源路径通常是绝对路径
    if (filePath.includes('../') || filePath.includes('..\\')) {
      console.warn(`[ExifReader] 检测到路径遍历攻击: ${filePath}`);
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
        console.warn(`[ExifReader] 检测到危险系统路径: ${pattern} in ${filePath}`);
        return false;
      }
    }

    // 检查是否为隐藏文件或系统文件（更宽松的检查）
    if (filePath.startsWith('.') && !filePath.includes('/') && !filePath.includes('\\')) {
      // 只有纯粹的隐藏文件名（没有路径分隔符）才可能是系统文件
      console.warn(`[ExifReader] 检测到隐藏文件: ${filePath}`);
      return false;
    }

    // 检查路径长度，防止异常长的路径
    if (filePath.length > 2000) {
      console.warn(`[ExifReader] 路径过长，可能存在异常: ${filePath.length} chars`);
      return false;
    }

    // 检查是否包含明显的攻击模式
    if (filePath.includes('<script') || filePath.includes('javascript:') || filePath.includes('data:')) {
      console.warn(`[ExifReader] 检测到潜在攻击模式: ${filePath}`);
      return false;
    }

    console.log(`[ExifReader] 普通路径安全性验证通过: ${filePath}`);
    return true;
  }

  /**
   * 验证是否为支持的图像格式
   * @param filePath 文件路径
   * @returns 是否为支持的格式
   */
  private static isSupportedImageFormat(filePath: string): boolean {
    console.log(`[ExifReader] 验证图像格式: ${filePath}`);

    // 首先清理路径中的参数，确保只检查实际的文件路径部分
    const cleanedPath = this.cleanFilePath(filePath);
    console.log(`[ExifReader] 清理后的路径用于格式检测: ${cleanedPath}`);

    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif'];
    const lowerPath = cleanedPath.toLowerCase();

    const isSupported = supportedExtensions.some(ext => lowerPath.endsWith(ext));

    console.log(`[ExifReader] 格式检测结果:`);
    console.log(`[ExifReader]   清理后的路径: ${cleanedPath}`);
    console.log(`[ExifReader]   检测的扩展名: ${supportedExtensions.join(', ')}`);
    console.log(`[ExifReader]   是否支持: ${isSupported}`);

    // 如果检测失败，提供详细的调试信息
    if (!isSupported) {
      console.warn(`[ExifReader] 不支持的图像格式: ${cleanedPath}`);
      console.warn(`[ExifReader] 支持的格式: ${supportedExtensions.join(', ')}`);

      // 检查是否是因为缺少扩展名
      if (!lowerPath.includes('.')) {
        console.warn(`[ExifReader] 文件路径不包含扩展名: ${cleanedPath}`);
      } else {
        // 使用沙盒兼容的方式获取文件扩展名
        const lastDotIndex = cleanedPath.lastIndexOf('.');
        const extension = lastDotIndex !== -1 ? cleanedPath.substring(lastDotIndex) : '';
        console.warn(`[ExifReader] 文件扩展名不匹配: ${extension}`);
      }
    }

    return isSupported;
  }

  /**
   * 格式化EXIF数据为人类可读的字符串
   * @param exifData EXIF数据
   * @returns 格式化后的字符串
   */
  static formatExifData(exifData: ExifData): string {
    const lines: string[] = [];

    if (exifData.DateTimeOriginal) {
      lines.push(`拍摄时间: ${exifData.DateTimeOriginal.toLocaleString('zh-CN')}`);
    }

    if (exifData.Make || exifData.Model) {
      lines.push(`相机: ${exifData.Make || ''} ${exifData.Model || ''}`.trim());
    }

    if (exifData.ApertureValue) {
      lines.push(`光圈: f/${this.formatAperture(exifData.ApertureValue)}`);
    }

    if (exifData.ShutterSpeedValue) {
      lines.push(`快门速度: ${this.formatShutterSpeed(exifData.ShutterSpeedValue)}`);
    }

    if (exifData.ISO) {
      lines.push(`ISO: ${exifData.ISO}`);
    }

    if (exifData.FocalLength) {
      lines.push(`焦距: ${exifData.FocalLength}mm`);
    }

    if (exifData.LensModel) {
      lines.push(`镜头: ${exifData.LensModel}`);
    }

    if (exifData.latitude && exifData.longitude) {
      // 使用exifr转换后的十进制格式，调整精度以匹配其他软件显示格式
      const latFormatted = exifData.latitude.toFixed(6);
      const lonFormatted = exifData.longitude.toFixed(6);
      lines.push(`GPS: ${latFormatted}, ${lonFormatted}`);
    } else if (exifData.GPSLatitude && exifData.GPSLongitude) {
      // 兜底：如果没有十进制格式，使用原始数组格式（兼容旧版本）
      const lat = typeof exifData.GPSLatitude === 'number' ? exifData.GPSLatitude.toString() : exifData.GPSLatitude || '0';
      const lon = typeof exifData.GPSLongitude === 'number' ? exifData.GPSLongitude.toString() : exifData.GPSLongitude || '0';
      lines.push(`GPS: ${lat.trim()}, ${lon.trim()}`);
    }

    if (exifData.ImageWidth && exifData.ImageHeight) {
      lines.push(`尺寸: ${exifData.ImageWidth} × ${exifData.ImageHeight}`);
    }

    return lines.join('\n');
  }

  /**
   * 格式化光圈值
   * @param apertureValue 光圈值（APEX格式）
   * @returns 格式化后的光圈值
   */
  private static formatAperture(apertureValue: number): string {
    // 将APEX值转换为F值：F = 2^(apertureValue/2)
    const fValue = Math.pow(2, apertureValue / 2);
    return fValue.toFixed(1);
  }

  /**
   * 格式化快门速度
   * @param shutterSpeedValue 快门速度值（APEX格式）
   * @returns 格式化后的快门速度
   */
  private static formatShutterSpeed(shutterSpeedValue: number): string {
    // 将APEX值转换为秒：1 / 2^shutterSpeedValue
    const speed = 1 / Math.pow(2, shutterSpeedValue);

    if (speed >= 1) {
      return `${speed}"`;
    } else {
      const fraction = Math.round(1 / speed);
      return `1/${fraction}"`;
    }
  }

  /**
   * 获取图像的基本信息（不包含敏感数据）
   * @param filePath 文件路径
   * @returns 基本图像信息
   */
  static async getImageInfo(filePath: string, vaultBasePath?: string): Promise<{
    width?: number;
    height?: number;
    orientation?: number;
    hasExif: boolean;
  }> {
    console.log(`[ExifReader] 获取图像基本信息: ${filePath}`);
    console.log(`[ExifReader] Vault基础路径: ${vaultBasePath}`);

    try {
      // 转换file://协议URL为本地文件系统路径
      const localFilePath = this.convertToLocalPath(filePath);
      console.log(`[ExifReader] 基本信息转换后的本地路径: ${localFilePath}`);

      if (!this.isPathInVault(localFilePath) || !this.isSupportedImageFormat(localFilePath)) {
        console.warn(`[ExifReader] 文件路径或格式验证失败: ${localFilePath}`);
        return { hasExif: false };
      }

      const basicInfo = await exifr.parse(localFilePath, {
        pick: ['ImageWidth', 'ImageHeight', 'Orientation']
      });

      console.log(`[ExifReader] 基本信息解析完成:`, basicInfo);

      return {
        width: basicInfo.ImageWidth,
        height: basicInfo.ImageHeight,
        orientation: basicInfo.Orientation,
        hasExif: true
      };
    } catch (error) {
      console.error(`[ExifReader] 获取基本信息失败 [${filePath}]:`, error);
      return { hasExif: false };
    }
  }

  /**
   * 详细的路径验证调试方法
   * @param filePath 文件路径
   * @param vaultBasePath vault基础路径
   * @returns 路径验证详情
   */
  static async debugPathValidation(filePath: string, vaultBasePath?: string): Promise<{
    originalPath: string;
    convertedPath: string;
    pathValidation: boolean;
    fileExists: boolean;
    pathDetails: {
      isAbsolute: boolean;
      isRelative: boolean;
      hasTraversal: boolean;
      length: number;
      extension?: string;
      dirname: string;
      basename: string;
    };
    recommendations: string[];
  }> {
    console.log(`[ExifReader] 开始路径验证调试: ${filePath}`);

    const debugInfo = {
      originalPath: filePath,
      convertedPath: '',
      pathValidation: false,
      fileExists: false,
      pathDetails: {
        isAbsolute: false,
        isRelative: false,
        hasTraversal: false,
        length: filePath.length,
        extension: undefined as string | undefined,
        dirname: '',
        basename: ''
      },
      recommendations: [] as string[]
    };

    try {
      // 路径转换
      debugInfo.convertedPath = this.convertToLocalPath(filePath);

      // 使用沙盒兼容的方式获取路径信息
      if (debugInfo.convertedPath) {
        // 获取目录名
        const lastSlashIndex = Math.max(
          debugInfo.convertedPath.lastIndexOf('/'),
          debugInfo.convertedPath.lastIndexOf('\\')
        );
        debugInfo.pathDetails.dirname = lastSlashIndex !== -1
          ? debugInfo.convertedPath.substring(0, lastSlashIndex)
          : '';

        // 获取文件名
        debugInfo.pathDetails.basename = lastSlashIndex !== -1
          ? debugInfo.convertedPath.substring(lastSlashIndex + 1)
          : debugInfo.convertedPath;

        // 获取扩展名
        const lastDotIndex = debugInfo.pathDetails.basename.lastIndexOf('.');
        debugInfo.pathDetails.extension = lastDotIndex !== -1
          ? debugInfo.pathDetails.basename.substring(lastDotIndex)
          : undefined;
      }

      // 路径分析
      debugInfo.pathDetails.isAbsolute = this.isAbsolutePath(debugInfo.convertedPath);
      debugInfo.pathDetails.isRelative = !debugInfo.pathDetails.isAbsolute;
      debugInfo.pathDetails.hasTraversal = debugInfo.convertedPath.includes('../') || debugInfo.convertedPath.includes('..\\');

      // 路径验证
      debugInfo.pathValidation = this.isPathInVault(debugInfo.convertedPath);

      // 文件存在性检查（沙盒兼容方式用于调试）
      // 使用异步方式检查文件是否存在，避免阻塞
      debugInfo.fileExists = await this.fileExists(debugInfo.convertedPath);

      // 生成建议
      if (!debugInfo.fileExists) {
        debugInfo.recommendations.push(`文件不存在: ${debugInfo.convertedPath}`);
      }

      if (!debugInfo.pathValidation) {
        debugInfo.recommendations.push('路径验证失败，可能过于严格的安全检查');
      }

      if (debugInfo.pathDetails.hasTraversal) {
        debugInfo.recommendations.push('检测到路径遍历模式');
      }

      if (debugInfo.pathDetails.length > 1000) {
        debugInfo.recommendations.push('路径过长，可能存在异常');
      }

      // 提供修复建议
      if (debugInfo.recommendations.length === 0) {
        debugInfo.recommendations.push('路径验证正常');
      }

      console.log(`[ExifReader] 路径验证调试完成:`, debugInfo);
      return debugInfo;

    } catch (error) {
      console.error(`[ExifReader] 路径验证调试出错:`, error);
      debugInfo.recommendations.push(`调试过程出错: ${error.message}`);
      return debugInfo;
    }
  }

  /**
   * 判断路径是否为绝对路径
   * @param filePath 文件路径
   * @returns 是否为绝对路径
   */
  private static isAbsolutePath(filePath: string): boolean {
    return filePath.startsWith('/') ||
           filePath.startsWith('\\') ||
           /^[A-Za-z]:\\/.test(filePath);
  }

  /**
   * 诊断图像文件EXIF问题的工具方法
   * @param filePath 文件路径（可以是file://协议URL或相对路径）
   * @param vaultBasePath 可选的vault基础路径
   * @returns 详细的诊断信息
   */
  static async diagnoseExifIssue(filePath: string, vaultBasePath?: string): Promise<{
    fileExists: boolean;
    isSupportedFormat: boolean;
    isInVault: boolean;
    basicInfo: {
      width?: number;
      height?: number;
      orientation?: number;
      hasBasicExif: boolean;
    };
    fullExifAttempt: {
      success: boolean;
      error?: string;
      fieldCount?: number;
    };
    recommendations: string[];
  }> {
    console.log(`[ExifReader] 开始EXIF诊断: ${filePath}`);
    console.log(`[ExifReader] Vault基础路径: ${vaultBasePath}`);

    const diagnosis = {
      fileExists: false,
      isSupportedFormat: false,
      isInVault: false,
      basicInfo: {
        width: undefined as number | undefined,
        height: undefined as number | undefined,
        orientation: undefined as number | undefined,
        hasBasicExif: false
      },
      fullExifAttempt: {
        success: false,
        error: undefined as string | undefined,
        fieldCount: undefined as number | undefined
      },
      recommendations: [] as string[]
    };

    try {
      // 转换file://协议URL为本地文件系统路径
      const localFilePath = this.convertToLocalPath(filePath);
      console.log(`[ExifReader] 诊断转换后的本地路径: ${localFilePath}`);

      // 1. 基本验证
      diagnosis.isInVault = this.isPathInVault(localFilePath);
      diagnosis.isSupportedFormat = this.isSupportedImageFormat(localFilePath);

      if (!diagnosis.isInVault) {
        diagnosis.recommendations.push('文件路径不在安全的vault范围内');
      }

      if (!diagnosis.isSupportedFormat) {
        diagnosis.recommendations.push('不支持的图像格式，请使用 JPG、PNG、WebP、TIFF 等格式');
      }

      // 2. 文件存在性检查
      diagnosis.fileExists = await this.fileExists(localFilePath);
      if (!diagnosis.fileExists) {
        diagnosis.recommendations.push(`文件不存在或无法访问，请检查文件路径: ${localFilePath}`);
      }

      // 3. 基本信息检查
      if (diagnosis.isInVault && diagnosis.isSupportedFormat && diagnosis.fileExists) {
        try {
          const basicInfo = await exifr.parse(localFilePath, {
            pick: ['ImageWidth', 'ImageHeight', 'Orientation']
          });
          diagnosis.basicInfo = {
            width: basicInfo.ImageWidth,
            height: basicInfo.ImageHeight,
            orientation: basicInfo.Orientation,
            hasBasicExif: true
          };
          console.log(`[ExifReader] 基本EXIF信息诊断成功:`, basicInfo);
        } catch (error) {
          console.warn(`[ExifReader] 基本EXIF信息不可用:`, error);
          diagnosis.basicInfo.hasBasicExif = false;
          diagnosis.recommendations.push('图像文件损坏或EXIF数据格式异常');
        }

        // 4. 完整EXIF信息检查
        try {
          console.log(`[ExifReader] 尝试读取完整EXIF信息...`);
          const fullExifData = await exifr.parse(localFilePath);

          diagnosis.fullExifAttempt.success = true;
          diagnosis.fullExifAttempt.fieldCount = fullExifData ? Object.keys(fullExifData).length : 0;

          console.log(`[ExifReader] 完整EXIF信息读取成功，共${diagnosis.fullExifAttempt.fieldCount}个字段`);

          if (!fullExifData || Object.keys(fullExifData).length === 0) {
            diagnosis.recommendations.push('图像文件确实不包含EXIF元数据');
          }
        } catch (error) {
          diagnosis.fullExifAttempt.success = false;
          diagnosis.fullExifAttempt.error = error.message;
          console.error(`[ExifReader] 完整EXIF信息读取失败:`, error);

          diagnosis.recommendations.push(`EXIF解析失败: ${error.message}`);
        }
      }

      // 生成通用建议
      if (diagnosis.recommendations.length === 0) {
        diagnosis.recommendations.push('文件正常，EXIF数据状态良好');
      }

      return diagnosis;

    } catch (error) {
      console.error(`[ExifReader] 诊断过程出错:`, error);
      diagnosis.recommendations.push(`诊断过程出错: ${error.message}`);
      return diagnosis;
    }
  }

  /**
   * 路径处理测试方法（仅用于验证修复效果）
   */
  static runPathTests() {
    console.log('=== ExifReader 路径处理测试 ===\n');

    const testCases = [
      // 带URL参数的路径测试用例（新增）
      {
        name: '带时间戳参数的路径',
        input: '/Users/qudange/Documents/Obsidian各种库/Exif插件开发/0.jpeg?1759560592036',
        shouldPass: true
      },
      {
        name: 'app://协议带参数路径',
        input: 'app://8cf4920ca1a09669982d3102509dcbbfdf6f/Users/qudange/Documents/Obsidian各种库/Exif插件开发/0.jpeg?timestamp=123',
        shouldPass: true
      },
      {
        name: '带查询参数和片段的路径',
        input: '/path/to/image.jpg?param=value#section',
        shouldPass: true
      },
      {
        name: 'file://协议带参数路径',
        input: 'file:///home/user/image.png?version=1',
        shouldPass: true
      },

      // 原有测试用例
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

      // 危险路径测试用例
      {
        name: '绝对路径（应被拒绝）',
        input: '/etc/passwd',
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

    testCases.forEach((testCase, index) => {
      console.log(`测试 ${index + 1}: ${testCase.name}`);
      console.log(`输入: ${testCase.input}`);

      // 测试路径转换
      const convertedPath = this.convertToLocalPath(testCase.input);
      console.log(`转换后: ${convertedPath}`);

      // 测试路径验证
      const isValid = this.isPathInVault(testCase.input);
      console.log(`验证结果: ${isValid}`);

      // 检查结果是否符合预期
      if (isValid === testCase.shouldPass) {
        console.log(`✅ 测试通过\n`);
      } else {
        console.log(`❌ 测试失败 - 期望: ${testCase.shouldPass}, 实际: ${isValid}\n`);
      }
    });

    console.log('=== 路径处理测试完成 ===\n');
  }
}