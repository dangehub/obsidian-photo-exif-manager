import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { ExifReader, ExifData } from './src/utils/ExifReader';
import { ExifModal } from './src/ui/ExifModal';

interface PhotoExifManagerSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: PhotoExifManagerSettings = {
	mySetting: 'default'
}

export default class PhotoExifManagerPlugin extends Plugin {
	settings: PhotoExifManagerSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (_evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// 添加EXIF读取命令
		this.addCommand({
			id: 'read-photo-exif',
			name: '读取照片EXIF信息',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile && this.isImageFile(activeFile)) {
					if (!checking) {
						this.readCurrentPhotoExif();
					}
					return true;
				}
				return false;
			}
		});

		// 添加EXIF诊断命令
		this.addCommand({
			id: 'diagnose-photo-exif',
			name: '诊断照片EXIF问题',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile && this.isImageFile(activeFile)) {
					if (!checking) {
						this.diagnoseCurrentPhotoExif();
					}
					return true;
				}
				return false;
			}
		});

		// 添加路径验证调试命令
		this.addCommand({
			id: 'debug-path-validation',
			name: '调试路径验证问题',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile && this.isImageFile(activeFile)) {
					if (!checking) {
						this.debugPathValidation(activeFile);
					}
					return true;
				}
				return false;
			}
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * 检查文件是否为支持的图像格式
	 * @param file 文件对象
	 * @returns 是否为图像文件
	 */
	private isImageFile(file: TFile): boolean {
		// 检查文件大小限制（例如：最大50MB）
		const maxSize = 50 * 1024 * 1024; // 50MB
		if (file.stat.size > maxSize) {
			return false;
		}

		const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif'];
		const filePath = file.path.toLowerCase();
		return supportedExtensions.some(ext => filePath.endsWith(ext));
	}

	/**
	 * 验证文件是否在安全的vault路径内
	 * @param file 文件对象
	 * @returns 是否为安全的文件
	 */
	private isSafeFile(file: TFile): boolean {
		const filePath = file.path;

		// 防止访问隐藏文件或系统文件
		if (filePath.startsWith('.') || filePath.includes('/.')) {
			return false;
		}

		// 防止路径遍历攻击
		if (filePath.includes('..')) {
			return false;
		}

		// 确保文件在附件文件夹内（如果适用）
		// 可以根据需要添加更多路径验证

		return true;
	}

	/**
	 * 读取当前活动照片的EXIF信息并显示模态框
	 */
	private async readCurrentPhotoExif(): Promise<void> {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('没有打开的文件');
			return;
		}

		// 安全验证
		if (!this.isImageFile(activeFile) || !this.isSafeFile(activeFile)) {
			new Notice('文件类型不支持或路径不安全');
			return;
		}

		try {
			new Notice(`正在读取 ${activeFile.name} 的EXIF信息...`);

			// 使用Obsidian的getResourcePath获取正确的文件系统路径
			const resourcePath = this.app.vault.getResourcePath(activeFile);
			console.log(`[Main] 原始文件路径: ${activeFile.path}`);
			console.log(`[Main] 资源路径: ${resourcePath}`);

			// 读取EXIF信息
			const exifData = await ExifReader.readExif(resourcePath, this.app.vault.getName());

			if (exifData) {
				// 显示成功通知
				new Notice(`EXIF信息读取成功！拍摄时间: ${exifData.DateTimeOriginal?.toLocaleString('zh-CN') || '未知'}`);

				// 显示EXIF模态框
				new ExifModal(this.app, activeFile, exifData).open();

				// 在控制台输出详细信息供调试
				console.log(`=== ${activeFile.name} 的EXIF信息 ===`);
				console.log(ExifReader.formatExifData(exifData));
				console.log('原始EXIF数据:', exifData);
			} else {
				// 即使没有EXIF数据，也显示模态框告知用户，并提供诊断选项
				new ExifModal(this.app, activeFile, null, () => this.diagnoseCurrentPhotoExif()).open();
			}
		} catch (error) {
			console.error('读取EXIF信息时出错:', error);

			// 根据错误类型提供友好的错误消息，并显示调试信息
			let errorMessage = '读取EXIF信息失败';
			if (error.message?.includes('vault')) {
				errorMessage = '无法访问文件：请确保文件在正确的vault路径内';
			} else if (error.message?.includes('格式')) {
				errorMessage = '不支持的图像格式';
			} else if (error.message?.includes('不存在')) {
				errorMessage = `文件不存在或无法访问: ${activeFile.name}`;
			} else {
				errorMessage = `读取失败：${error.message || '未知错误'}`;
			}

			// 显示详细错误信息到控制台
			console.error(`[Main] EXIF读取失败详情:`, {
				文件名: activeFile.name,
				相对路径: activeFile.path,
				资源路径: this.app.vault.getResourcePath(activeFile),
				错误信息: error.message,
				错误堆栈: error.stack
			});

			new Notice(errorMessage);
		}
	}

	/**
	 * 调试路径验证问题
	 */
	private async debugPathValidation(activeFile: TFile): Promise<void> {
		try {
			new Notice(`开始路径验证调试: ${activeFile.name}...`);

			// 使用Obsidian的getResourcePath获取正确的文件系统路径
			const resourcePath = this.app.vault.getResourcePath(activeFile);
			console.log(`[Main] 调试路径验证 - 原始文件路径: ${activeFile.path}`);
			console.log(`[Main] 调试路径验证 - 资源路径: ${resourcePath}`);

			// 使用新的调试方法
			const debugInfo = await ExifReader.debugPathValidation(resourcePath, this.app.vault.getName());

			// 显示调试结果
			console.log(`=== ${activeFile.name} 路径验证调试结果 ===`);
			console.log('调试详情:', debugInfo);

			// 构建用户友好的调试信息
			let debugMessage = `路径验证调试完成\n`;
			debugMessage += `文件: ${debugInfo.pathDetails.basename}\n`;
			debugMessage += `路径验证: ${debugInfo.pathValidation ? '✅ 通过' : '❌ 失败'}\n`;
			debugMessage += `文件存在: ${debugInfo.fileExists ? '✅ 是' : '❌ 否'}\n`;
			debugMessage += `路径类型: ${debugInfo.pathDetails.isAbsolute ? '绝对路径' : '相对路径'}\n`;

			if (debugInfo.recommendations.length > 0) {
				debugMessage += `\n📋 建议:\n`;
				debugInfo.recommendations.forEach((rec, index) => {
					debugMessage += `${index + 1}. ${rec}\n`;
				});
			}

			console.log(debugMessage);
			new Notice('路径验证调试完成，请查看控制台获取详细信息');

		} catch (error) {
			console.error('路径验证调试时出错:', error);
			new Notice(`调试失败：${error.message || '未知错误'}`);
		}
	}

	/**
		* 诊断当前活动照片的EXIF问题
		*/
	private async diagnoseCurrentPhotoExif(): Promise<void> {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('没有打开的文件');
			return;
		}

		// 安全验证
		if (!this.isImageFile(activeFile) || !this.isSafeFile(activeFile)) {
			new Notice('文件类型不支持或路径不安全');
			return;
		}

		try {
			new Notice(`正在诊断 ${activeFile.name} 的EXIF问题...`);

			// 使用Obsidian的getResourcePath获取正确的文件系统路径
			const resourcePath = this.app.vault.getResourcePath(activeFile);
			console.log(`[Main] 诊断 - 原始文件路径: ${activeFile.path}`);
			console.log(`[Main] 诊断 - 资源路径: ${resourcePath}`);

			// 使用新的诊断方法
			const diagnosis = await ExifReader.diagnoseExifIssue(resourcePath, this.app.vault.getName());

			// 显示诊断结果
			console.log(`=== ${activeFile.name} EXIF诊断结果 ===`);
			console.log('诊断详情:', diagnosis);

			// 构建用户友好的诊断信息
			let diagnosisMessage = `EXIF诊断完成\n`;

			if (diagnosis.fileExists && diagnosis.isInVault && diagnosis.isSupportedFormat) {
				diagnosisMessage += `✅ 文件状态正常\n`;

				if (diagnosis.basicInfo.hasBasicExif) {
					diagnosisMessage += `✅ 基本EXIF信息可用 (${diagnosis.basicInfo.width}×${diagnosis.basicInfo.height})\n`;
				} else {
					diagnosisMessage += `⚠️ 基本EXIF信息不可用\n`;
				}

				if (diagnosis.fullExifAttempt.success) {
					diagnosisMessage += `✅ 完整EXIF信息可用 (${diagnosis.fullExifAttempt.fieldCount}个字段)\n`;
				} else {
					diagnosisMessage += `❌ 完整EXIF信息读取失败: ${diagnosis.fullExifAttempt.error}\n`;
				}
			} else {
				diagnosisMessage += `❌ 文件验证失败\n`;
			}

			if (diagnosis.recommendations.length > 0) {
				diagnosisMessage += `\n📋 建议:\n`;
				diagnosis.recommendations.forEach((rec, index) => {
					diagnosisMessage += `${index + 1}. ${rec}\n`;
				});
			}

			// 显示通知（缩短版）
			const shortMessage = diagnosis.fileExists && diagnosis.isSupportedFormat ?
				'EXIF诊断完成，请查看控制台获取详细信息' :
				'文件验证失败，请查看控制台获取详细信息';

			new Notice(shortMessage);

			// 在控制台输出完整诊断信息
			console.log(diagnosisMessage);

		} catch (error) {
			console.error('诊断EXIF信息时出错:', error);

			// 显示详细诊断错误信息到控制台
			console.error(`[Main] EXIF诊断失败详情:`, {
				文件名: activeFile.name,
				相对路径: activeFile.path,
				资源路径: this.app.vault.getResourcePath(activeFile),
				错误信息: error.message,
				错误堆栈: error.stack
			});

			new Notice(`诊断失败：${error.message || '未知错误'}`);
		}
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: PhotoExifManagerPlugin;

	constructor(app: App, plugin: PhotoExifManagerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
