
import store from '@/store'
import { MxFun } from 'mxdraw'
import { WebGLRenderer, Scene, OrthographicCamera, PerspectiveCamera, Vector2, Camera } from 'three'



let _moveFun:  (this: Document, ev: MouseEvent) => any 
/**
 * THREE 的放大镜功能
 *  */
export class MagnifyLens {
    private _renderer: WebGLRenderer
    private _textureSize!: number
    scale = 2
    // 选框大小(同时决定显示区域)
    selectionSize = 120
    private _moveVet2: Vector2
    update: () => void
    constructor(renderer: WebGLRenderer, scene: Scene, camera: OrthographicCamera | PerspectiveCamera | Camera) {
        document.removeEventListener('mousemove', _moveFun)
        this._renderer = renderer;
        // 获取控件对象
        const mxobj = MxFun.getCurrentDraw()
        // 设置窗口和鼠标大小
        this.setSize()
        // 放大镜倍数
        this.setScale()

        const width =  mxobj.getViewWidth();
        const height = mxobj.getViewHeight();

        console.log(width, height)
        // 记录鼠标屏幕坐标位置
        this._moveVet2 = new Vector2()
        _moveFun = (e)=>{
            this._moveVet2.x = e.x
            this._moveVet2.y = e.y
        }
        document.addEventListener('mousemove', _moveFun)
        
       
        
        // 实时渲染的更新函数
        this.update = ()=> {
             // 截取整个屏幕的像素并恢复整个屏幕的显示范围
             this._renderer.setScissor(0, 0, width, width);
             this._renderer.setViewport(0, 0, width, height)
             // 渲染整屏
             this._renderer.render( scene, camera );
            // 保存当前视区
            const ptSaveView1 = mxobj.screenCoord2Doc(0, 0);
            const ptSaveView2 = mxobj.screenCoord2Doc(width, height);
            // 计算要截取的视区范围
            const offset = (this._textureSize / 2) / this.scale
            const pt1View = mxobj.screenCoord2Doc(this._moveVet2.x + offset - 8, this._moveVet2.y + offset)
            const pt2View = mxobj.screenCoord2Doc(this._moveVet2.x - offset - 8, this._moveVet2.y - offset)
            
            //  开启裁剪
            this._renderer.setScissorTest( true );
            // 相机定位到指定要截取的视区范围内
            mxobj.zoomW(pt1View, pt2View, false);
           
            // 设置裁剪和视口大小
            const boxSize = this._getBoxSize()
            const x = this._moveVet2.x + boxSize / 2
            const y = height - this._moveVet2.y + boxSize / 2
            this._renderer.setScissor(x, y, this._textureSize, this._textureSize );
            this._renderer.setViewport(x, y, this._textureSize, this._textureSize );
            // 清空缓存颜色 设置为灰色背景（小窗口）
            this._renderer.clearColor()
            this._renderer.setClearColor(0x333333);
            
            this._renderer.render( scene, camera );
            this._renderer.clearDepth()
            
            // 恢复到原来的缩放视口范围
            mxobj.zoomW(ptSaveView1, ptSaveView2, false);

            // 关闭裁剪
            this._renderer.setScissorTest( false );

        }
        this.open()
    }
    // 设置窗口和鼠标样式框大小
    setSize(size = 60) {
        // 鼠标样式框设置大小
        this.selectionSize = size;
        // 获取像素比例
        const dpr = this._renderer.getPixelRatio();
        store.commit('setCursorRectSize', Math.min(128, this._getBoxSize()))
        // 确定小窗口视口
        this._textureSize = this.selectionSize * dpr;
    }
    // 设置放大倍数
    setScale(scale = 3) {
        this.scale = scale
        store.commit('setCursorRectSize', Math.min(128, this._getBoxSize()))
    }

    private _getBoxSize() {
       return this.selectionSize / this.scale
    }
    // 开启
    open() {
        const animate = ()=> {
            this._renderer.setAnimationLoop(animate);
            this.update()
        }
        animate();
    }
    // 关闭
    close() {
        document.removeEventListener('mousemove', _moveFun)
        this._renderer.setAnimationLoop(null)
    }
    
}