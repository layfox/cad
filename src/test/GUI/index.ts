import { GUI } from "dat.gui";
import { MxFun } from "mxdraw";
export { defaultMxDbEntityParams } from "./defaultMxDbEntityParams";
let gui: GUI
export interface GuiParam {
    name: string;
    isColor?: boolean;
    label?:string;
    box?: {
        min: number;
        max: number;
        step?: number
    } | string[] | number[];
    defaultValue?: any
    onChange?: (obj:any, value:any)=> void,
}

export const removeGui = ()=> gui && gui.domElement && gui.domElement.remove()
export const createGui = <O extends object = object, T extends GuiParam = GuiParam>(obj?: O, params?:T[])=> {
    removeGui()
    gui = new GUI()
    
    parseParams(gui, obj, params)
    return gui
};

/** 创建分栏 */ 
export const createGuiFolder = <O extends object = object, T extends GuiParam = GuiParam>(gui: GUI, name: string, obj?: O, params?:T[])=> {
    const folder = gui.addFolder(name)
    parseParams(folder, obj, params)
    return folder
}

/** 解析参数 */ 
const parseParams = <O extends object = object, T extends GuiParam = GuiParam>(gui: GUI, obj?: O, params?: T[])=> {
    if(obj && params) {
        params.forEach((param)=> {
            const { name, box, label, onChange, isColor, defaultValue } = param;
            const add = isColor? gui.addColor.bind(gui) : gui.add.bind(gui);
            if(!(obj as any)[name]) (obj as any)[name] = defaultValue
            let boxPrams:any[] = []
            if(Array.isArray(box)) {
                boxPrams = [box]
            }else {
                const { min, max, step } = box || {}
                boxPrams = [ min, max, step]
            };
            add(obj, name as keyof O, ...boxPrams).name(label || name).onFinishChange(v=> {
                onChange && onChange(obj, v);
                (obj as any).setNeedUpdateDisplay(true)
                MxFun.updateDisplay()
            })
        })
    }
    return gui
}