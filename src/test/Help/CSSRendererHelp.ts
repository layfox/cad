import { MrxDbgUiPrPoint, MxFun } from "mxdraw";
import { AxesHelper, BoxGeometry, GridHelper, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer";
import { InfoWindow } from "./InfoWindow";

 // CSS2D CSS3D Renderer帮助对象
 export class CSSRendererHelp {
    // 类型定义
    cssRenderer!: CSS2DRenderer | CSS3DRenderer;
    cssRendererDomElement!: HTMLElement;
    config: { [x: string]: any; };
    init: () => void;
  
    update: (name: string, innerHtml: string) => this;
    remove: (name: string, parent: Object3D) => this;
    get: (name: string) => any;
    removeAll: (parent: Object3D) => this;
    render: () => this;
    add: (option: {
      parent?: Object3D;
      scale?: Vector3;
      /* CSSObject three.js 提供的 CSS2DObject或者CSS2DObject类 */
      CSSObject: typeof CSS2DObject | typeof CSS3DObject | CSS2DObject | CSS3DObject;
      name: string;
      element?: string | HTMLElement;
      position?: Vector3;
    }) => this;
  
    /**
     * CSSRenderer three.js 提供的 CSS2DRenderer或者CSS3DRenderer 渲染器类
     * 参考：https://github.com/mrdoob/three.js/blob/master/examples/css2d_label.html
     * */ 
    constructor(CSSRenderer: typeof CSS2DRenderer | typeof CSS3DRenderer) {
      // 内部共用参数
      const draw = MxFun.getCurrentDraw()
     
      const canvas = draw.getCanvas()
      const camera = draw.getCamera()
      const scene = draw.getScene()
      const renderer = draw.getRenderer()
      const el = renderer.domElement?.parentNode ? (renderer.domElement?.parentNode as HTMLElement) : renderer.domElement
      const DOC = document
      this.config = {}
      // 初始化
      this.init = function() {
        // 辅助线:
        // scene.add(new AxesHelper(10)) // 坐标轴辅助红x 绿y 蓝z
        // scene.add(new GridHelper(100, 100))// 网格参考线

        const cssRenderer = new CSSRenderer()
        cssRenderer.setSize(el.offsetWidth, el.offsetHeight)
        cssRenderer.domElement.style.position = 'absolute'
        cssRenderer.domElement.style.top = '0'
        el.appendChild(cssRenderer.domElement)
        this.cssRenderer = cssRenderer
        this.cssRendererDomElement = cssRenderer.domElement
        this.setReadOnly()
       
      }
      // 添加
      this.add = function(option: {
        parent?: Object3D,
        scale?: Vector3
        /* CSSObject three.js 提供的 CSS2DObject或者CSS2DObject类 */ 
        CSSObject: typeof CSS2DObject | typeof CSS3DObject | CSS2DObject | CSS3DObject,
        name: string,
        element?: string | HTMLElement,
        position?: Vector3
      }) {
        let list  = []
        if( Array.isArray(option)){
          list = option
        } else {
          list.push(option)
        }
        list.forEach(e => {
            let dom: HTMLElement
            if(typeof e.element === 'string') {
              DOC.body.insertAdjacentHTML('beforeend', e.element)
              dom = DOC.body.lastChild as HTMLElement
            }else if( e.element instanceof HTMLElement){
              dom = e.element
            }else {
              dom = document.createElement('div')
            }
            let label: CSS2DObject | CSS3DObject

            if((e.CSSObject instanceof CSS2DObject) || (e.CSSObject instanceof CSS3DObject)) {
              label = e.CSSObject
            }else {
              label = new e.CSSObject( dom )
            }
   
            label.userData.isCss23D  = true
            label.name = e.name
            if(e.position?.isVector3) label.position.set(e.position.x, e.position.y, e.position.z)
            if(e.scale?.isVector3)  label.scale.set(e.scale.x, e.scale.y, e.scale.z)
            e.parent ? e.parent.add(label) : scene.add(label)
            this.config[e.name] = label
        })
        return this
      }
      // 更新
      this.update = function(name: string, innerHtml: string) {
          this.config[name].element.innerHTML = innerHtml
          return this
      }
      // 删除
      this.remove = function(name:string, parent: Object3D) {
        parent = parent || scene
        const obj = parent.getObjectByName(name)
        obj && parent.remove(obj)
        if(this.config[name]) delete this.config[name]
        return this
      }
      // 获取
      this.get = function(name:string) {
        return this.config[name]
      }
      // 删除全部
      this.removeAll = function(parent:Object3D) {
        //需要倒序遍历
        for(let i = parent.children.length - 1 ; i >= 0; i--) {
            const e = parent.children[i]
            if( e?.userData?.isCss23D ) {
                const name = e.name
                parent.remove(e)
                if(this.config[name]) delete this.config[name]
            }
        }
        return this
      }
      this.render = function() {
        this.cssRenderer.render( scene, camera )
        return this
      }
      // 初始化
      this.init()
      
    }
    /**
     * 设置是否为只读状态（只读：无法监听dom事件，包括选择聚焦等所有事件都将被禁用）
     * */ 
    setReadOnly(is: boolean = true) {
      this.cssRenderer.domElement.style.pointerEvents = is ? "none" : 'unset'
    }
   
  }

  // 绘制html 2d
  export async function drawHTML2D(): Promise<CSSRendererHelp | undefined> {
    const getPoint = new MrxDbgUiPrPoint();
    const point = await getPoint.go()
    if(!point) {
      return 
    }
    // const geometry = new BoxGeometry( 60000, 60000, 1 );
    // const material = new MeshBasicMaterial( {color: 0x00ff00} );
    // const cube = new Mesh( geometry, material );
    const cube  = new Object3D()
    cube.position.set(point.x, point.y, point.z)
    const css2DReaderHelp = new CSSRendererHelp(CSS2DRenderer)
    MxFun.getCurrentDraw().addObject(cube)
    const win = 
    css2DReaderHelp.add({
      parent: cube,
      name: "test1",
      CSSObject: new InfoWindow()
      .setTitle('测试标题0')
      .setContent('测试内容0')
    }).render()

    return css2DReaderHelp
  }



   //   绘制html 3d
  export async function drawHTML3D(): Promise<CSSRendererHelp | undefined> {
    const getPoint = new MrxDbgUiPrPoint();
    const point = await getPoint.go()
    if(!point) {
      return
    }

    const cube  = new Object3D()
    
    cube.position.set(point.x, point.y, 8888)
    
    MxFun.getCurrentDraw().addObject(cube)
  
    const css3DReaderHelp= new CSSRendererHelp(CSS3DRenderer)
    css3DReaderHelp.add({
      parent: cube,
      name: "test2",
      CSSObject: CSS3DObject,
      element: `<div class="ys-block">
                    <div class="ys-tit-sm"><span>标题</span></div>
                    <div class="ys-con">
                        测试123456
                    </div>
                </div>`,
        
    }).render()
    
    // 修改颜色
    // css2DReaderHelp.get('test1').element.style.color = '#fff'
    return css3DReaderHelp
  }