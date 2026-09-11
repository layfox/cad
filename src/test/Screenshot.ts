import html2canvas from "html2canvas";
import $, { type }  from "jquery";
import jcanvas from "jcanvas";
jcanvas($, window);

/**
 * 默认画笔线宽
 * @type {number}
 */
const defaultStrokeWidth = 1; // 画矩形选取框的线宽
export class screenshots {


 /**
  * 选取划线的canvasExt
  * @type {{drawRect: canvasExt.drawRect}}
  */
  public canvasExt = {
		/**
      *  画矩形
      * @param canvasId canvasId
      * @param penColor 画笔颜色
      * @param strokeWidth 线宽
      */
		drawRect(canvasId: string, penColor: string, strokeWidth: number) {
			const that: any = this;

			that.penColor = penColor;
			that.penWidth = strokeWidth;
			const canvas: any = document.getElementById(canvasId);
			// canvas 的矩形框
			const canvasRect = canvas && canvas.getBoundingClientRect();
			// canvas 矩形框的左上角坐标
			const canvasLeft = canvasRect && canvasRect.left;
			const canvasTop = canvasRect && canvasRect.top;

			// 要画的矩形的起点 xy
			let x = 0;
			let y = 0;

			// 鼠标点击按下事件，画图准备
		// 鼠标点击按下事件，画图准备
			const indexDom: any = $("#" + canvasId);
		// MxFun.addWindowsEvent((type:string,))
			if (canvas) {
			canvas.onmousedown = function(e: any) {
				// 设置画笔颜色和宽度
				const color = that.penColor;
				const penWidth = that.penWidth;
				// 确定起点
				x = e.clientX - canvasLeft;
				y = e.clientY - canvasTop;
				// 添加layer
				// console.log($("#"+canvasId).addLayer)

				indexDom.addLayer({
					type: 'rectangle',
					strokeStyle: color,
					strokeWidth: penWidth,
					name: 'areaLayer',
					fromCenter: false,
					x, y,
					width: 1,
					height: 1,
				});
				// 绘制
				indexDom.drawLayers();
				indexDom.saveCanvas();

				// 鼠标移动事件，画图
				canvas.onmousemove = function(e: any) {

					// 要画的矩形的宽高
					const width = e.clientX - canvasLeft - x;
					const height = e.clientY - canvasTop - y;

					// 清除之前画的
					indexDom.removeLayer('areaLayer');

					indexDom.addLayer({
						type: 'rectangle',
						strokeStyle: color,
						strokeWidth: penWidth,
						name: 'areaLayer',
						fromCenter: false,
						x, y,
						width,
						height,
					});

					indexDom.drawLayers();
				};
			};

			// 鼠标抬起
			canvas.onmouseup = function(e: any) {

		const color = that.penColor;
		const penWidth = that.penWidth;

		canvas.onmousemove = null;

		const width = e.clientX - canvasLeft - x;
		const height = e.clientY - canvasTop - y;

		indexDom.removeLayer('areaLayer');

		indexDom.addLayer({
			type: 'rectangle',
			strokeStyle: color,
			strokeWidth: penWidth,
			name: 'areaLayer',
			fromCenter: false,
			x, y,
			width,
			height,
		});

		indexDom.drawLayers();
		indexDom.saveCanvas();

		// 把body转成canvas

		const te: any = document.getElementById("myCanvas");
		// console.log(te.toDataURL('image/png'),'te') //这里获取到的加载画布本身的canvas就为空

		html2canvas(document.body, {
			scale: 1,
			// allowTaint: true,
			useCORS: true,  // 跨域使用


		}).then((canvas) => {
			// console.log(canvas.toDataURL('image/png'),'canvas')  //这里获取的整个网页截图的base64就已经没有canvas标签内容了
			let capture_x, capture_y;
			if (width > 0) {
				// 从左往右画
				capture_x = x + that.penWidth;
			} else {
				// 从右往左画
				capture_x = x + width + that.penWidth;
			}
			if (height > 0) {
				// 从上往下画
				capture_y = y + that.penWidth;
			} else {
				// 从下往上画
				capture_y = y + height + that.penWidth;
			}

			new screenshots().printClip(canvasId, canvas, capture_x, capture_y, Math.abs(width), Math.abs(height));
		});
		// 移除画的选取框
		indexDom.removeLayer('areaLayer');
		// 隐藏用于华画取框的canvas
		$("#" + canvasId).hide();
	};
		}


		},
 };

 /**
  * 选取截屏
  * @param canvasId
  */
public clipScreenshots(canvasId: string) {
		this.canvasExt.drawRect(canvasId, "red", defaultStrokeWidth);
 }

 /**
  * 打印截取区域
  * @param canvas 截取的canvas
  * @param capture_x 截取的起点x
  * @param capture_y 截取的起点y
  * @param capture_width 截取的起点宽
  * @param capture_height 截取的起点高
  */
  public printClip(canvasId: string, canvas: any, capture_x: number, capture_y: number, capture_width: number, capture_height: number) {
		// 创建一个用于截取的canvas
		const clipCanvas: any = document.createElement('canvas');
		clipCanvas.width = capture_width - 2;  // -2是避免将选中框截取
		clipCanvas.height = capture_height - 2;
		const box: any = document.getElementById(canvasId);
		console.log(capture_width, capture_height);

		if (capture_width == 0 && capture_height == 0) {
		box.remove();
		return;
   } else if (capture_width < 20 && capture_height < 20) {
		alert('截取的范围过小，请重新截取');
	//  let c:any = document.getElementById(canvasId);
	//  c.style.display = 'block';
		$("#bg_canvas").show();
		this.clipScreenshots("bg_canvas");
		return;
   }
		// 截取
		clipCanvas.getContext('2d').drawImage(canvas, capture_x, capture_y, capture_width, capture_height, 0, 0, capture_width, capture_height);
		const clipImgBase64 = clipCanvas.toDataURL();
		// 生成图片
		const clipImg = new Image();
		clipImg.src = clipImgBase64;
		const con = confirm('是否保存截图');
		if (con) {
		// $(clipImg).print()
		box.remove();
		this.downloadIamge(clipImgBase64);
		} else {
		box.remove();
		return;
			// downloadIamge(clipImgBase64)
		}
 }

 /**
  * 下载保存图片
  * @param imgUrl 图片地址
  */
public downloadIamge(imgUrl: string) {
		// 图片保存有很多方式，这里使用了一种投机的简单方法。
		// 生成一个a元素
		const a = document.createElement('a');
		// 创建一个单击事件
		const event = new MouseEvent('click');
		// 生成文件名称
		const timestamp = new Date().getTime();
		const name = imgUrl.substring(22, 30) + timestamp + '.png';
		a.download = name;
		// 将生成的URL设置为a.href属性
		a.href = imgUrl;
		// 触发a的单击事件 开始下载
		a.dispatchEvent(event);
 }

}
