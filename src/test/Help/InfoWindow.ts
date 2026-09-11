

// 弹框类
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import './infoWindow.css';
export class InfoWindow extends CSS2DObject {
	public titleDom: HTMLDivElement;
	public closeIconDom: HTMLDivElement;
	public contentDom: HTMLDivElement;
	constructor() {
		const domElement = document.createElement('div');
		super(domElement);
		this.element.className = 'mx_info_window';

		// 箭头
		const arrow = document.createElement('div');
		arrow.className = 'mx_info_window_arrow';
		this.element.appendChild(arrow);

		// 标题
		this.titleDom = document.createElement('div');
		this.titleDom.className = 'mx_info_window_title';

		this.titleDom.textContent = '';
		this.element.appendChild(this.titleDom);
		// 图标 关闭按钮

		this.closeIconDom = document.createElement('div');
		this.closeIconDom.className = 'mx_info_window_close';
		// 在渲染器的dom元素设置了pointerEvents = 'none' 的情况下该元素依然可以进行正常的事件交互
		this.closeIconDom.style.pointerEvents = 'visible';
		this.closeIconDom.addEventListener('click', () => {
			this.hide();
		});
		this.element.appendChild(this.closeIconDom);

		// 内容
		this.contentDom = document.createElement('div');
		this.contentDom.className = 'mx_info_window_content';
		this.contentDom.textContent = '';
		this.element.appendChild(this.contentDom);
	}
	// 设置标题
	public setTitle(title: string) {
		this.titleDom.textContent = title;
		return this;
	}
	// 设置内容
	public setContent(title: string) {
		this.contentDom.textContent = title;
		return this;
	}
	// 打开
	public open(coordinates?: [])  {
		this.element.className = 'mx_info_window display_block';
		return this;
	}
	// 隐藏
	public hide() {
		this.element.className = 'mx_info_window display_none';
		return this;
	}

	// 修改标题文字颜色
	public setTitleColor(color: string) {
		this.titleDom.style.color = color;
		return this;
	}
	// 修改标题背景
	public setTitleBackground(background: string) {
		this.titleDom.style.background = background;
		return this;
	}

		// 修改标题文字颜色
	public setContentColor(color: string) {
		this.contentDom.style.color = color;
		return this;
	}
	// 修改标题背景
	public setContentBackground(background: string) {
		this.contentDom.style.background = background;
		return this;
	}
	// 设置为只读属性
	public setReadOnly(is: boolean = true) {
		this.element.style.pointerEvents = is ? "none" : 'unset';
	}
}
