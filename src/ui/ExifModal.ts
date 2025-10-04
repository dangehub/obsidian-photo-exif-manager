import { App, Modal, Setting, TFile } from 'obsidian';
import { ExifReader, ExifData } from '../utils/ExifReader';

export class ExifModal extends Modal {
    private exifData: ExifData | null;
    private file: TFile;
    private imagePreviewEl: HTMLImageElement;
    private infoContainerEl: HTMLElement;
    private onDiagnose?: () => void;

    constructor(app: App, file: TFile, exifData: ExifData | null, onDiagnose?: () => void) {
        super(app);
        this.file = file;
        this.exifData = exifData;
        this.onDiagnose = onDiagnose;

        // 设置模态框的基本属性
        this.modalEl.addClass('photo-exif-modal');
        this.titleEl.setText(`${file.name} - EXIF信息`);
    }

    onOpen() {
        this.contentEl.empty();
        this.createLayout();
        this.populateContent();
    }

    onClose() {
        this.contentEl.empty();
        if (this.imagePreviewEl) {
            this.imagePreviewEl.remove();
        }
    }

    private createLayout() {
        // 创建主容器
        const container = this.contentEl.createDiv({ cls: 'exif-container' });

        // 创建图片预览区域
        const previewSection = container.createDiv({ cls: 'exif-preview-section' });
        this.createImagePreview(previewSection);

        // 创建信息展示区域
        this.infoContainerEl = container.createDiv({ cls: 'exif-info-section' });
    }

    private createImagePreview(parent: HTMLElement) {
        const previewContainer = parent.createDiv({ cls: 'image-preview-container' });

        // 创建图片元素
        this.imagePreviewEl = previewContainer.createEl('img', {
            cls: 'exif-image-preview',
            attr: {
                src: this.app.vault.getResourcePath(this.file),
                alt: this.file.name
            }
        });

        // 添加错误处理
        this.imagePreviewEl.onerror = () => {
            this.imagePreviewEl.style.display = 'none';
            previewContainer.createEl('div', {
                cls: 'no-preview',
                text: '无法预览图像'
            });
        };

        // 添加加载处理
        this.imagePreviewEl.onload = () => {
            this.imagePreviewEl.style.display = 'block';
        };
    }

    private populateContent() {
        if (!this.exifData) {
            this.showNoExifMessage();
            return;
        }

        this.infoContainerEl.empty();

        // 基本信息分组
        const basicInfo = [
            this.createInfoItem('拍摄时间', this.formatDateTime(this.exifData.DateTimeOriginal)),
            this.createInfoItem('创建时间', this.formatDateTime(this.exifData.CreateDate)),
            this.createInfoItem('图像尺寸', this.formatDimensions()),
        ].filter(item => item !== null) as HTMLElement[];

        if (basicInfo.length > 0) {
            this.createSection('基本信息', basicInfo);
        }

        // 相机信息分组
        const cameraInfo = [
            this.createInfoItem('相机品牌', this.exifData.Make),
            this.createInfoItem('相机型号', this.exifData.Model),
            this.createInfoItem('镜头型号', this.exifData.LensModel),
        ].filter(item => item !== null) as HTMLElement[];

        if (cameraInfo.length > 0) {
            this.createSection('相机信息', cameraInfo);
        }

        // 拍摄参数分组
        const exposureInfo = [
            this.createInfoItem('光圈值', this.formatAperture()),
            this.createInfoItem('快门速度', this.formatShutterSpeed()),
            this.createInfoItem('ISO感光度', this.exifData.ISO?.toString()),
            this.createInfoItem('焦距', this.formatFocalLength()),
        ].filter(item => item !== null) as HTMLElement[];

        if (exposureInfo.length > 0) {
            this.createSection('拍摄参数', exposureInfo);
        }

        // 位置信息分组
         if (this.exifData.latitude && this.exifData.longitude) {
             const locationInfo = [
                 this.createInfoItem('GPS坐标',
                     this.formatGPSCoordinates(this.exifData.latitude, this.exifData.longitude)),
                 this.createInfoItem('海拔高度', this.formatAltitude()),
             ].filter(item => item !== null) as HTMLElement[];

            if (locationInfo.length > 0) {
                this.createSection('位置信息', locationInfo);
            }
        }

        // 元数据分组
        const metadataInfo = [
            this.createInfoItem('软件信息', this.exifData.Software),
            this.createInfoItem('艺术家', this.exifData.Artist),
            this.createInfoItem('版权信息', this.exifData.Copyright),
        ].filter(item => item !== null) as HTMLElement[];

        if (metadataInfo.length > 0) {
            this.createSection('元数据', metadataInfo);
        }

        // 添加操作按钮
        this.addActionButtons();
    }

    private createSection(title: string, items: HTMLElement[]) {
        const section = this.infoContainerEl.createDiv({ cls: 'exif-section' });

        section.createEl('h3', {
            cls: 'exif-section-title',
            text: title
        });

        const itemsContainer = section.createDiv({ cls: 'exif-items' });
        items.forEach(item => itemsContainer.appendChild(item));
    }

    private createInfoItem(label: string, value: string | undefined): HTMLElement | null {
        if (!value || value.trim() === '') {
            return null;
        }

        const item = document.createElement('div');
        item.addClass('exif-info-item');

        const labelEl = item.createEl('div', {
            cls: 'exif-label',
            text: label
        });

        const valueEl = item.createEl('div', {
            cls: 'exif-value',
            text: value
        });

        // 添加复制功能
        item.addEventListener('click', () => {
            this.copyToClipboard(`${label}: ${value}`);
        });

        // 添加视觉反馈
        item.addEventListener('mouseenter', () => {
            item.addClass('hover');
        });

        item.addEventListener('mouseleave', () => {
            item.removeClass('hover');
        });

        return item;
    }

    private addActionButtons() {
        const actionsSection = this.infoContainerEl.createDiv({ cls: 'exif-actions' });

        // 复制所有信息按钮
        const copyAllBtn = actionsSection.createEl('button', {
            cls: 'exif-btn exif-btn-primary',
            text: '复制全部信息'
        });

        copyAllBtn.addEventListener('click', () => {
            this.copyAllExifData();
        });

        // 导出为Markdown按钮
        const exportBtn = actionsSection.createEl('button', {
            cls: 'exif-btn',
            text: '导出为Markdown'
        });

        exportBtn.addEventListener('click', () => {
            this.exportAsMarkdown();
        });
    }

    private showNoExifMessage() {
        this.infoContainerEl.empty();

        const noData = this.infoContainerEl.createDiv({ cls: 'no-exif-data' });
        noData.createEl('div', {
            cls: 'no-exif-icon',
            text: '📷'
        });
        noData.createEl('div', {
            cls: 'no-exif-text',
            text: '未找到EXIF信息'
        });

        // 提供更详细的诊断信息和解决建议
        const descDiv = noData.createEl('div', {
            cls: 'no-exif-desc'
        });

        descDiv.createEl('p', {
            text: '这张照片可能没有嵌入EXIF元数据，或者存在以下问题：'
        });

        const possibleCauses = descDiv.createEl('ul', {
            cls: 'no-exif-causes'
        });

        possibleCauses.createEl('li', {
            text: '📸 照片是截图或编辑后的图像（丢失了原始EXIF数据）'
        });
        possibleCauses.createEl('li', {
            text: '🔧 图像经过某些软件处理，导致EXIF信息丢失'
        });
        possibleCauses.createEl('li', {
            text: '📁 文件格式不受支持或文件损坏'
        });
        possibleCauses.createEl('li', {
            text: '🔒 文件路径或权限问题'
        });

        const suggestions = descDiv.createEl('div', {
            cls: 'no-exif-suggestions'
        });

        suggestions.createEl('p', {
            text: '🔍 排查建议：'
        });

        const suggestionList = suggestions.createEl('ol');
        suggestionList.createEl('li', {
            text: '使用"诊断照片EXIF问题"命令获取详细的诊断信息'
        });
        suggestionList.createEl('li', {
            text: '检查照片是否为原始照片（而非截图或编辑后的图像）'
        });
        suggestionList.createEl('li', {
            text: '尝试使用在线EXIF查看器验证照片是否有EXIF信息'
        });
        suggestionList.createEl('li', {
            text: '确保照片格式为 JPG、PNG、WebP 或 TIFF'
        });

        // 添加诊断按钮
        const diagnoseBtn = suggestions.createEl('button', {
            cls: 'exif-btn exif-btn-secondary',
            text: '🔍 运行EXIF诊断'
        });

        diagnoseBtn.addEventListener('click', async () => {
            // 关闭当前模态框
            this.close();

            // 调用诊断回调函数
            if (this.onDiagnose) {
                this.onDiagnose();
            }
        });
    }

    private formatDateTime(date: Date | undefined): string | undefined {
        if (!date) return undefined;
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }

    private formatDimensions(): string | undefined {
        if (this.exifData?.ImageWidth && this.exifData?.ImageHeight) {
            return `${this.exifData.ImageWidth} × ${this.exifData.ImageHeight}`;
        }
        return undefined;
    }

    private formatAperture(): string | undefined {
        if (!this.exifData?.ApertureValue) return undefined;

        const fValue = Math.pow(2, this.exifData.ApertureValue / 2);
        return `f/${fValue.toFixed(1)}`;
    }

    private formatShutterSpeed(): string | undefined {
        if (!this.exifData?.ShutterSpeedValue) return undefined;

        const speed = 1 / Math.pow(2, this.exifData.ShutterSpeedValue);

        if (speed >= 1) {
            return `${speed}"`;
        } else {
            const fraction = Math.round(1 / speed);
            return `1/${fraction}"`;
        }
    }

    private formatFocalLength(): string | undefined {
        if (!this.exifData?.FocalLength) return undefined;
        return `${this.exifData.FocalLength}mm`;
    }

    private formatAltitude(): string | undefined {
        if (!this.exifData?.GPSAltitude) return undefined;
        return `${this.exifData.GPSAltitude}m`;
    }

    private formatGPSCoordinates(latitude: number | undefined, longitude: number | undefined): string {
        // 格式化十进制GPS坐标，调整精度以匹配其他软件显示格式
        if (latitude === undefined || longitude === undefined) {
            return '0.000000, 0.000000';
        }

        // 调整精度到与其他软件一致的小数位数（参考任务描述的精度）
        const latFormatted = latitude.toFixed(6);
        const lonFormatted = longitude.toFixed(6);

        return `${latFormatted}, ${lonFormatted}`;
    }

    private async copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            // 显示短暂的成功提示
            const toast = document.createElement('div');
            toast.addClass('exif-toast');
            toast.setText('已复制到剪贴板');
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.remove();
            }, 2000);
        } catch (err) {
            console.error('复制失败:', err);
        }
    }

    private copyAllExifData() {
        if (!this.exifData) return;

        const allInfo = ExifReader.formatExifData(this.exifData);
        const filename = this.file.name;

        const fullText = `=== ${filename} 的EXIF信息 ===\n${allInfo}`;

        this.copyToClipboard(fullText);
    }

    private exportAsMarkdown() {
        if (!this.exifData) return;

        const sections = [
            `### ${this.file.name}`,
            '',
            '**基本信息:**',
            this.exifData.DateTimeOriginal ? `- 拍摄时间: ${this.formatDateTime(this.exifData.DateTimeOriginal)}` : null,
            this.exifData.CreateDate ? `- 创建时间: ${this.formatDateTime(this.exifData.CreateDate)}` : null,
            this.formatDimensions() ? `- 图像尺寸: ${this.formatDimensions()}` : null,
            '',
            '**相机信息:**',
            this.exifData.Make ? `- 相机品牌: ${this.exifData.Make}` : null,
            this.exifData.Model ? `- 相机型号: ${this.exifData.Model}` : null,
            this.exifData.LensModel ? `- 镜头型号: ${this.exifData.LensModel}` : null,
            '',
            '**拍摄参数:**',
            this.formatAperture() ? `- 光圈值: ${this.formatAperture()}` : null,
            this.formatShutterSpeed() ? `- 快门速度: ${this.formatShutterSpeed()}` : null,
            this.exifData.ISO ? `- ISO感光度: ${this.exifData.ISO}` : null,
            this.formatFocalLength() ? `- 焦距: ${this.formatFocalLength()}` : null,
            '',
            '**位置信息:**',
            (this.exifData.latitude && this.exifData.longitude) ?
                `- GPS坐标: ${this.formatGPSCoordinates(this.exifData.latitude, this.exifData.longitude)}` : null,
            this.formatAltitude() ? `- 海拔高度: ${this.formatAltitude()}` : null,
        ].filter(item => item !== null).join('\n');

        this.copyToClipboard(sections);
    }
}