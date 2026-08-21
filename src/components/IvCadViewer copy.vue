<template>
  <div class="iv-cad-viewer">
    <!-- 顶部导航栏 -->
    <div class="header-bar">
      <div class="header-left">
        <span class="title">CAD 查看器</span>
        <!-- <Tag color="green" size="small">mxdraw - 梦想凯德 CAD</Tag> -->
      </div>
      <!-- <div class="header-right">
        <Button type="primary" size="small" icon="md-help" @click="showHelp = true">使用帮助</Button>
      </div> -->
    </div>

    <div class="main-content">
      <!-- 左侧控制面板 -->
      <div class="left-panel" :class="{ collapsed: panelCollapsed }">
        <!-- 收缩/展开按钮 -->
        <div class="panel-toggle-btn" @click="togglePanel">
          <Icon :type="panelCollapsed ? 'md-arrow-forward' : 'md-arrow-back'" />
        </div>

        <!-- 面板内容（收缩时隐藏） -->
        <div v-show="!panelCollapsed" class="panel-content">
        <!-- 文件加载 -->
        <!-- <Card title="文件加载" icon="md-folder-open" :bordered="false">
          <div class="panel-section">
            <Input v-model="fileUrlInput" placeholder="输入 .mxweb 文件 URL" />
            <Button type="primary" icon="md-play" long style="margin-top: 8px" @click="loadFromUrl">
              从 URL 加载
            </Button>
          </div>
          <Divider style="margin: 12px 0" />
          <div class="panel-section">
            <Alert type="warning" show-icon :closable="false">
              DWG 文件需先转换为 .mxweb 格式
            </Alert>
          </div>
        </Card> -->

        <!-- 视图控制 -->
        <!-- <Card title="视图控制" icon="md-zoom" :bordered="false">
          <Row :gutter="8">
            <Col span="12">
              <Button icon="md-expand" long @click="zoomAll">适应窗口</Button>
            </Col>
            <Col span="12">
              <Button icon="md-add" long @click="zoomIn">放大</Button>
            </Col>
          </Row>
          <Row :gutter="8" style="margin-top: 8px">
            <Col span="12">
              <Button icon="md-remove" long @click="zoomOut">缩小</Button>
            </Col>
            <Col span="12">
              <Button icon="md-refresh" long @click="resetView">重置视图</Button>
            </Col>
          </Row>
          <Row :gutter="8" style="margin-top: 8px">
            <Col span="12">
              <Button icon="md-square-outline" long @click="zoomWindow">窗口缩放</Button>
            </Col>
            <Col span="12">
              <Button icon="md-redo" long @click="regen">重绘</Button>
            </Col>
          </Row>
        </Card> -->

        <!-- 测量工具 -->
        <Card title="测量工具" icon="md-ruler" :bordered="false">
          <Row :gutter="8">
            <Col span="12">
              <Button type="success" icon="md-code-working" long @click="startMeasureDistance">距离测量</Button>
            </Col>
            <Col span="12">
              <Button type="success" icon="md-navigate" long @click="startMeasureCoord">坐标测量</Button>
            </Col>
          </Row>
          <Row :gutter="8" style="margin-top: 8px">
            <!-- <Col span="12">
              <Button type="success" icon="md-square-outline" long @click="startMeasureArea">面积测量</Button>
            </Col> -->
            <!-- <Col span="12">
              <Button type="success" icon="md-compass" long @click="startMeasureAngle">角度测量</Button>
            </Col> -->
          </Row>
          <!-- <div class="measure-result" v-if="measureResult">
            <Alert type="info" show-icon :closable="false">
              <span slot="desc">{{ measureResult }}</span>
            </Alert>
          </div> -->
        </Card>

        <!-- 批注工具 -->
        <!-- <Card title="批注工具" icon="md-create" :bordered="false">
          <Row :gutter="8">
            <Col span="12">
              <Button type="warning" icon="md-remove" long @click="drawLine">直线</Button>
            </Col>
            <Col span="12">
              <Button type="warning" icon="md-radio-button-off" long @click="drawCircle">圆形</Button>
            </Col>
          </Row>
          <Row :gutter="8" style="margin-top: 8px">
            <Col span="12">
              <Button type="warning" icon="md-square-outline" long @click="drawRect">矩形</Button>
            </Col>
            <Col span="12">
              <Button type="warning" icon="md-text" long @click="drawText">文字</Button>
            </Col>
          </Row>
          <Row :gutter="8" style="margin-top: 8px">
            <Col span="12">
              <Button type="warning" icon="md-cloud" long @click="drawCloudLine">云线</Button>
            </Col>
            <Col span="12">
              <Button type="warning" icon="md-arrow-forward" long @click="drawArrow">箭头</Button>
            </Col>
          </Row>
          <Row :gutter="8" style="margin-top: 8px">
            <Col span="12">
              <Button type="warning" icon="md-chatboxes" long @click="drawComment">引线标注</Button>
            </Col>
            <Col span="12">
              <Button type="error" icon="md-trash" long @click="deleteEntity">删除批注</Button>
            </Col>
          </Row>
          <Row :gutter="8" style="margin-top: 8px">
            <Col span="24">
              <Button type="info" icon="md-create" long @click="editText">编辑文字</Button>
            </Col>
          </Row>
        </Card> -->

        <!-- 导出工具 -->
        <!-- <Card title="导出工具" icon="md-download" :bordered="false">
          <Row :gutter="8">
            <Col span="12">
              <Button type="primary" icon="md-camera" long @click="takeScreenshot">截图保存</Button>
            </Col>
            <Col span="12">
              <Button type="primary" icon="md-print" long @click="printView">打印图纸</Button>
            </Col>
          </Row>
          <Row :gutter="8" style="margin-top: 8px">
            <Col span="12">
              <Button type="primary" icon="md-save" long @click="saveAnnotations">保存批注</Button>
            </Col>
            <Col span="12">
              <Button icon="md-list" long @click="showLayers = true">图层列表</Button>
            </Col>
          </Row>
        </Card> -->

        <!-- 图层信息 -->
        <Card title="图层信息" icon="md-layers" :bordered="false">
          <div class="layer-count">
            <span class="count">{{ layerCount }}</span>
            <span class="label">个图层</span>
          </div>
          <div v-if="layers.length > 0" class="layer-list-panel">
            <div class="layer-list-header">
              <span>点击图层可切换显示/隐藏</span>
            </div>
            <div class="layer-list-scroll">
              <div
                v-for="(layer, index) in layers"
                :key="layer.name + '_' + index"
                class="layer-item-row"
                :class="{ 'layer-off': layer.off }"
                @click="toggleLayer(layer, layer.off)"
              >
                <span
                  class="layer-color-dot"
                  :style="{ backgroundColor: getLayerColor(layer.colorValue) }"
                ></span>
                <span class="layer-name-text">{{ layer.name }}</span>
                <Icon :type="layer.off ? 'md-eye-off' : 'md-eye'" class="layer-eye-icon" />
              </div>
            </div>
          </div>
          <div v-else class="layer-empty">
            暂无图层数据
          </div>
        </Card>
        </div>
      </div>

      <!-- 右侧 Viewer -->
      <div class="right-panel">
        <div ref="viewerContainer" class="viewer-container">
          <canvas ref="mxcadCanvas" id="mxcad"></canvas>
        </div>

        <!-- 加载遮罩 -->
        <div v-if="loading" class="loading-overlay">
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-text">{{ loadingText }}</div>
            <div class="loading-step">{{ loadingStep }}</div>
            <div class="loading-progress">
              <div class="progress-bar" :style="{ width: loadingProgress + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- 当前命令提示 -->
        <div v-if="currentCommand" class="command-tip">
          <Tag color="blue" :closable="true" @click="stopCommand">
            <Icon type="md-build" /> 当前：{{ currentCommand }}
          </Tag>
        </div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="status-bar">
      <div class="status-left">
        <span class="status-item">
          <Icon type="md-document" />
          {{ fileName || '图纸未加载' }}
        </span>
        <!-- <span class="status-item">
          <Icon type="md-layers" />
          {{ layerCount }} 个图层
        </span> -->
      </div>
      <div class="status-right">
        <!-- <span class="status-item">
          <Icon type="md-code-working" />
          引擎: MxCAD (mxcad)
        </span> -->
        <span class="status-item">
          <span class="status-dot" :class="{ ready: viewerReady }"></span>
          {{ viewerReady ? '就绪' : '初始化中' }}
        </span>
      </div>
    </div>

    <!-- 图层弹窗 -->
    <Modal
      v-model="showLayers"
      title="图层管理"
      width="500px"
      :footer-hide="true"
    >
      <div class="layer-list">
        <div
          v-for="(layer, index) in layers"
          :key="layer.name + '_' + index"
          class="layer-item"
        >
          <Checkbox
            :checked="!layer.off"
            @on-change="toggleLayer(layer, $event)"
          >
            <span
              class="layer-color"
              :style="{ backgroundColor: getLayerColor(layer.colorValue) }"
            ></span>
            {{ layer.name }}
          </Checkbox>
        </div>
        <div v-if="layers.length === 0" class="empty-tip">暂无图层数据</div>
      </div>
    </Modal>

    <!-- 帮助弹窗 -->
    <Modal
      v-model="showHelp"
      title="使用帮助"
      width="600px"
    >
      <div class="help-content">
        <h4>操作说明</h4>
        <ul>
          <li><strong>鼠标滚轮</strong>：缩放视图</li>
          <li><strong>鼠标中键拖动</strong>：平移视图</li>
          <li><strong>鼠标左键</strong>：选择实体 / 绘制批注</li>
          <li><strong>鼠标右键</strong>：结束命令 / 取消选择</li>
          <li><strong>ESC 键</strong>：取消当前命令</li>
        </ul>
        <h4>测量工具</h4>
        <ul>
          <li><strong>距离测量</strong>：点击两点测量距离</li>
          <li><strong>面积测量</strong>：点击多点测量面积</li>
          <li><strong>坐标测量</strong>：点击测量点坐标</li>
          <li><strong>角度测量</strong>：测量两条线的夹角</li>
        </ul>
        <h4>批注工具</h4>
        <ul>
          <li><strong>直线 / 圆 / 矩形</strong>：绘制基础图形批注</li>
          <li><strong>文字</strong>：添加文字批注</li>
          <li><strong>云线 / 箭头</strong>：强调标记</li>
          <li><strong>引线标注</strong>：带引线的文字标注</li>
          <li><strong>编辑文字</strong>：选中文字后修改内容</li>
          <li><strong>删除批注</strong>：选择要删除的批注对象</li>
        </ul>
        <h4>支持格式</h4>
        <ul>
          <li>.mxweb - MxCAD 专用格式（需先转换）</li>
          <li>.dwg - AutoCAD 格式（需后端转换服务）</li>
        </ul>
        <h4>技术说明</h4>
        <p>基于 mxdraw / MxCAD 梦想凯德 CAD 引擎，采用 WebAssembly + Canvas + WebGL 技术实现浏览器端 DWG 图纸渲染。</p>
      </div>
    </Modal>

    <!-- 编辑文字弹窗 -->
    <Modal
      v-model="showEditTextModal"
      title="编辑文字"
      width="400px"
      @on-ok="confirmEditText"
      @on-cancel="cancelEditText"
    >
      <div class="edit-text-form">
        <div class="form-item">
          <label>实体类型：</label>
          <span>{{ editTextType }}</span>
        </div>
        <div class="form-item">
          <label>文字内容：</label>
          <Input
            v-model="editTextValue"
            type="textarea"
            :rows="3"
            placeholder="请输入文字内容"
          />
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { createMxCad, MxCpp } from "mxcad";
import { MxFun, MrxDbgUiPrPoint, McEdGetPointWorldDrawObject, MxDbLine, MxDbCircleShape, MxDbAnyLine } from "mxdraw";
import { RegistMxCommands, RxInitMxEntity } from "@/test/command";
import { MyRect } from "@/test/DrawRect";
import * as THREE from "three";

@Component
export default class IvCadViewer extends Vue {
  // 文件 URL
  // fileUrlInput = "./HDMY-XJH.mxweb";
  fileUrlInput = "./YTSF-001.mxweb"
  fileName = "";

  // 加载状态
  loading = true;
  loadingText = "正在初始化 MxCAD 查看器...";
  loadingStep = "准备中";
  loadingProgress = 0;

  // Viewer 状态
  viewerReady = false;
  mxcad: any = null;
  mxDraw: any = null;

  // 图层数据
  layerCount = 0;
  layers: any[] = [];
  showLayers = false;

  // 帮助弹窗
  showHelp = false;

  // 编辑文字弹窗
  showEditTextModal = false;
  editTextValue = "";
  editTextType = "";
  editTextEntity: any = null;

  // 当前命令
  currentCommand = "";

  // 测量结果
  measureResult = "";

  // 面板收缩状态
  panelCollapsed = false;

  // Ctrl + 左键平移状态
  isCtrlPanning = false;
  lastMouseX = 0;
  lastMouseY = 0;

  mounted() {
    this.initViewer();
    // 监听 ESC 键取消命令
    document.addEventListener("keydown", this.handleKeydown);
    // 监听 Ctrl + 左键平移
    this.$nextTick(() => {
      this.initCtrlPan();
    });
  }

  beforeDestroy() {
    this.destroyViewer();
    document.removeEventListener("keydown", this.handleKeydown);

    // 移除 Ctrl + 左键平移事件监听
    const canvas = document.getElementById("mxcad") as HTMLCanvasElement;
    if (canvas) {
      canvas.removeEventListener("mousedown", this.handleCtrlPanMouseDown);
      canvas.removeEventListener("mousemove", this.handleCtrlPanMouseMove);
      canvas.removeEventListener("mouseup", this.handleCtrlPanMouseUp);
      canvas.removeEventListener("mouseleave", this.handleCtrlPanMouseUp);
    }
  }

  /**
   * 键盘事件处理
   */
  handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      this.stopCommand();
    }
  }

  /**
   * 初始化 Viewer
   */
  async initViewer() {
    try {
      this.loading = true;
      this.loadingText = "正在初始化 MxCAD 查看器...";
      this.loadingStep = "加载核心模块";
      this.loadingProgress = 10;

      // 注册所有命令和自定义实体
      console.log("注册命令和自定义实体...");
      RegistMxCommands();
      RxInitMxEntity();

      const useST = !("SharedArrayBuffer" in window);
      const wasmPath = useST ? "./wasm/2d-st/" : "./wasm/2d/";

      console.log("WASM 路径:", wasmPath);

      this.loadingStep = "初始化 WASM 模块";
      this.loadingProgress = 30;

      const mxcad = await createMxCad({
        canvas: "#mxcad",
        locateFile: (fileName: string) => {
          return new URL(wasmPath + fileName, window.location.origin + window.location.pathname).href;
        },
        // fileUrl: "./HDMY-XJH.mxweb",
        // fileUrl:"./HDMY-XJH-v2.mxweb",
        fileUrl:"./YTSF-001.mxweb",
        browse: true,
        multipleSelect: false,
        middlePan: 1,
        authorized_service: "same_current_page_url",
        onInit: () => {
          console.log("MxCAD 初始化回调，加载字体...");
          try {
            MxCpp.App.addNetworkLoadingFont([
              "txt.shx",
              "simplex.shx",
              "gdt.shx",
              "aaa.shx",
              "ltypeshp.shx",
              "complex.shx",
              "isocp.shx",
              "isoct.shx",
              "romans.shx"
            ]);
            MxCpp.App.addNetworkLoadingBigFont([
              "hztxt.shx",
              "gbcbig.shx",
              "tssdchn.shx",
              "gbhzfs.shx"
            ]);
          } catch (e) {
            console.warn("字体加载警告:", e);
          }
        }
      });

      console.log("MxCAD 实例创建成功:", mxcad);

      this.mxcad = mxcad;
      this.mxDraw = mxcad.mxdraw;

      // 启用鼠标中键平移（我们会把 Ctrl + 左键模拟成中键事件）
      try {
        mxcad.mxdraw.setMouseMiddlePan(true);
        console.log("已启用中键平移，Ctrl + 左键会模拟成中键事件");
      } catch (e) {
        console.warn("设置中键平移失败:", e);
      }

      // 二次注册命令（mxcad 实例创建后可能会重置 MxFun 状态）
      console.log("二次注册命令...");
      RegistMxCommands();
      RxInitMxEntity();

      this.loadingStep = "初始化完成";
      this.loadingProgress = 90;

      // 监听文件加载完成
      mxcad.mxdraw.on("openFileComplete", () => {
        console.log("文件加载完成");
        this.onFileLoaded();
      });

      // 监听图层数据更新
      mxcad.mxdraw.on("uiSetLayerData", (listLayer: any[]) => {
        console.log("图层数据更新:", listLayer);
        this.layers = listLayer.map(v => ({
          name: v.name,
          id: v.id,
          off: v.off,
          colorValue: v.colorValue
        }));
        this.layerCount = this.layers.length;
      });

      // 监听命令行输入
      MxFun.listenForCommandLineInput(({ msCmdTip, msCmdDisplay, msCmdText }: any) => {
        console.log("命令行:", msCmdTip, msCmdDisplay, msCmdText);
        // 如果有测量结果，更新显示
        if (msCmdDisplay && msCmdDisplay.length > 0) {
          this.measureResult = msCmdDisplay;
        }
      });

      this.viewerReady = true;
      this.loading = false;
      this.loadingProgress = 100;
      this.fileName = "HDMY-XJH.mxweb";

      // this.$Message.success("MxCAD 查看器初始化成功");

    } catch (error) {
      console.error("MxCAD 初始化失败:", error);
      this.loading = false;
      this.$Message.error("MxCAD 查看器初始化失败: " + (error as Error).message);
    }
  }

  /**
   * 文件加载完成回调
   */
  onFileLoaded() {
    console.log("文件加载完成");
    this.zoomAll();
    
    // 主动获取图层数据（防止 uiSetLayerData 事件未触发）
    try {
      if (this.mxcad && this.mxcad.getDatabase) {
        const layerTable = this.mxcad.getDatabase().getLayerTable();
        const aryId = layerTable.getAllRecordId();
        console.log("主动获取图层数量:", aryId.length);
        
        if (aryId.length > 0 && this.layers.length === 0) {
          this.layers = aryId.map((id: any) => {
            const record = id.getMcDbLayerTableRecord();
            if (record) {
              let colorValue = 0;
              try {
                if (record.color && record.color.getColorValue) {
                  colorValue = record.color.getColorValue();
                }
              } catch (e) {}
              
              return {
                name: record.name,
                id: id,
                off: record.isOff,
                colorValue: colorValue
              };
            }
            return {
              name: "未知图层",
              id: id,
              off: false,
              colorValue: 0
            };
          });
          this.layerCount = this.layers.length;
          console.log("主动获取图层数据成功，图层数量:", this.layerCount);
          console.log("图层列表:", this.layers.map((l: any) => l.name));
        }
      }
    } catch (e) {
      console.warn("主动获取图层数据失败:", e);
    }
  }

  /**
   * 从 URL 加载
   */
  loadFromUrl() {
    if (!this.fileUrlInput) {
      this.$Message.warning("请输入文件 URL");
      return;
    }
    // 重新加载
    this.destroyViewer();
    this.$nextTick(() => {
      this.initViewerWithFile(this.fileUrlInput);
    });
  }

  /**
   * 带文件初始化
   */
  async initViewerWithFile(fileUrl: string) {
    try {
      this.loading = true;
      this.loadingText = "正在加载图纸...";
      this.loadingStep = "创建渲染实例";
      this.loadingProgress = 50;

      const useST = !("SharedArrayBuffer" in window);
      const wasmPath = useST ? "./wasm/2d-st/" : "./wasm/2d/";

      const mxcad = await createMxCad({
        canvas: "#mxcad",
        locateFile: (fileName: string) => {
          return new URL(wasmPath + fileName, window.location.origin + window.location.pathname).href;
        },
        fileUrl: fileUrl,
        browse: true,
        multipleSelect: false,
        middlePan: 1,
        authorized_service: "same_current_page_url",
        onInit: () => {
          try {
            MxCpp.App.addNetworkLoadingFont([
              "txt.shx", "simplex.shx", "gdt.shx", "aaa.shx",
              "ltypeshp.shx", "complex.shx", "isocp.shx", "isoct.shx", "romans.shx"
            ]);
            MxCpp.App.addNetworkLoadingBigFont([
              "hztxt.shx", "gbcbig.shx", "tssdchn.shx", "gbhzfs.shx"
            ]);
          } catch (e) {
            console.warn("字体加载警告:", e);
          }
        }
      });

      this.mxcad = mxcad;
      this.mxDraw = mxcad.mxdraw;
      this.fileName = fileUrl.split("/").pop() || "unknown";

      // 启用鼠标中键平移（我们会把 Ctrl + 左键模拟成中键事件）
      try {
        mxcad.mxdraw.setMouseMiddlePan(true);
        console.log("已启用中键平移，Ctrl + 左键会模拟成中键事件");
      } catch (e) {
        console.warn("设置中键平移失败:", e);
      }

      // 二次注册命令
      RegistMxCommands();
      RxInitMxEntity();

      mxcad.mxdraw.on("openFileComplete", () => {
        this.onFileLoaded();
      });

      mxcad.mxdraw.on("uiSetLayerData", (listLayer: any[]) => {
        console.log("-------listLayer--------",listLayer)
        this.layers = listLayer.map(v => ({
          name: v.name,
          id: v.id,
          off: v.off,
          colorValue: v.colorValue
        }));
        this.layerCount = this.layers.length;
      });

      this.viewerReady = true;
      this.loading = false;
      this.loadingProgress = 100;

    } catch (error) {
      console.error("文件加载失败:", error);
      this.loading = false;
      this.$Message.error("文件加载失败: " + (error as Error).message);
    }
  }

  // ============== 视图控制 ==============

  /**
   * 缩放至全图
   */
  zoomAll() {
    if (this.mxDraw) {
      this.executeCommand("Mx_ZoomE");
    }
  }

  /**
   * 放大
   */
  zoomIn() {
    if (this.mxDraw) {
      this.mxDraw.zoomScale(1.5);
    }
  }

  /**
   * 缩小
   */
  zoomOut() {
    if (this.mxDraw) {
      this.mxDraw.zoomScale(0.67);
    }
  }

  /**
   * 重置视图
   */
  resetView() {
    this.zoomAll();
  }

  /**
   * 窗口缩放
   */
  zoomWindow() {
    this.executeCommand("BR_ZoomW", "窗口缩放");
  }

  /**
   * 重绘
   */
  regen() {
    this.executeCommand("BR_Regen");
    this.$Message.info("正在重绘视图...");
  }

  // ============== 测量工具 ==============

  /**
   * 距离测量
   */
  startMeasureDistance() {
    this.measureResult = "";
    this.executeCommand("BR_DimensionMeasurement", "距离测量");
  }

  /**
   * 面积测量
   */
  startMeasureArea() {
    this.measureResult = "";
    this.executeCommand("BR_Area", "面积测量");
  }

  /**
   * 坐标测量
   */
  startMeasureCoord() {
    this.measureResult = "";
    this.executeCommand("BR_Coord", "坐标测量");
  }

  /**
   * 角度测量
   */
  startMeasureAngle() {
    this.measureResult = "";
    this.executeCommand("BR_AngleSurveying", "角度测量");
  }

  // ============== 批注工具 ==============

  /**
   * 绘制直线
   */
  drawLine() {
    this.executeCommand("Mx_Line", "绘制直线");
  }

  /**
   * 绘制圆 - 直接实现
   */
  async drawCircle() {
    if (!this.viewerReady || !MxFun) {
      this.$Message.warning("查看器未就绪");
      return;
    }

    try {
      this.currentCommand = "绘制圆形";
      const getPoint = new MrxDbgUiPrPoint();
      const worldDraw = new McEdGetPointWorldDrawObject();
      const mxObj = MxFun.getCurrentDraw();
      const circle = new MxDbCircleShape();

      circle.color = new THREE.Color("#ff0000");
      circle.startAngle = 0;
      circle.endAngle = Math.PI * 2;

      getPoint.setUserDraw(worldDraw);
      getPoint.setMessage("\n指定圆心:");

      // 第一步：指定圆心
      const centerPt = await getPoint.go();
      if (!centerPt) {
        this.currentCommand = "";
        return;
      }

      circle.center = centerPt.clone();

      // 第二步：指定半径
      worldDraw.setDraw((v: THREE.Vector3) => {
        const radius = centerPt.distanceTo(v);
        circle.radius = radius;
        worldDraw.drawCustomEntity(circle);
      });

      getPoint.setBasePt(centerPt);
      getPoint.setUseBasePt(true);
      getPoint.setMessage("\n指定半径:");

      const radiusPt = await getPoint.go();
      if (!radiusPt) {
        this.currentCommand = "";
        return;
      }

      const radius = centerPt.distanceTo(radiusPt);
      circle.radius = radius;
      circle.center = centerPt;

      mxObj.addMxEntity(circle);
      this.$Message.success("圆形绘制成功");
      this.currentCommand = "";

    } catch (e) {
      console.error("绘制圆形失败:", e);
      this.$Message.error("绘制圆形失败");
      this.currentCommand = "";
    }
  }

  /**
   * 绘制矩形 - 官方标准实现（MyRect 自定义实体做动态预览）
   */
  async drawRect() {
    if (!this.viewerReady || !MxFun) {
      this.$Message.warning("查看器未就绪");
      return;
    }

    try {
      this.currentCommand = "绘制矩形";
      console.log("[矩形绘制] 开始绘制矩形（官方标准实现）");
      
      const getPoint = new MrxDbgUiPrPoint();
      const mxObj = MxFun.getCurrentDraw();

      getPoint.setMessage("\n指定第一点:");
      console.log("[矩形绘制] 等待第一点...");

      // 第一步：指定第一点
      const pt1 = await getPoint.go();
      if (!pt1) {
        console.log("[矩形绘制] 取消第一点");
        this.currentCommand = "";
        return;
      }
      console.log("[矩形绘制] 第一点:", pt1.x, pt1.y);

      // 使用官方 MyRect 实体做动态预览（重写了 worldDraw，用四条线绘制）
      const previewRect = new MyRect();
      previewRect.pt1 = pt1;
      previewRect.ang = 0;  // 正矩形，不旋转
      previewRect.color = new THREE.Color("#ff6600");
      previewRect.dLineWidth = MxFun.screenCoordLong2Doc(2);
      previewRect.lineWidthByPixels = true;

      // 动态预览
      const worldDrawComment = new McEdGetPointWorldDrawObject();
      worldDrawComment.setDraw((currentPoint: THREE.Vector3) => {
        previewRect.pt2 = currentPoint;
        worldDrawComment.drawCustomEntity(previewRect);
      });

      getPoint.setBasePt(pt1);
      getPoint.setUseBasePt(true);
      getPoint.setUserDraw(worldDrawComment);
      getPoint.setMessage("\n指定第二点:");
      console.log("[矩形绘制] 等待第二点...");

      // 第二步：指定第二点
      const pt2 = await getPoint.go();
      if (!pt2) {
        console.log("[矩形绘制] 取消第二点");
        this.currentCommand = "";
        return;
      }
      console.log("[矩形绘制] 第二点:", pt2.x, pt2.y);

      // 最终绘制：使用四条 MxDbLine 绘制矩形（保证渲染可靠）
      console.log("[矩形绘制] 开始绘制四条线...");

      const lineTop = new MxDbLine();
      lineTop.pt1 = new THREE.Vector3(pt1.x, pt1.y, 0);
      lineTop.pt2 = new THREE.Vector3(pt2.x, pt1.y, 0);
      lineTop.color = new THREE.Color("#ff6600");
      lineTop.setLineWidth(2);
      lineTop.setLineWidthByPixels(true);
      mxObj.addMxEntity(lineTop);
      console.log("[矩形绘制] 上边绘制完成");

      const lineRight = new MxDbLine();
      lineRight.pt1 = new THREE.Vector3(pt2.x, pt1.y, 0);
      lineRight.pt2 = new THREE.Vector3(pt2.x, pt2.y, 0);
      lineRight.color = new THREE.Color("#ff6600");
      lineRight.setLineWidth(2);
      lineRight.setLineWidthByPixels(true);
      mxObj.addMxEntity(lineRight);
      console.log("[矩形绘制] 右边绘制完成");

      const lineBottom = new MxDbLine();
      lineBottom.pt1 = new THREE.Vector3(pt2.x, pt2.y, 0);
      lineBottom.pt2 = new THREE.Vector3(pt1.x, pt2.y, 0);
      lineBottom.color = new THREE.Color("#ff6600");
      lineBottom.setLineWidth(2);
      lineBottom.setLineWidthByPixels(true);
      mxObj.addMxEntity(lineBottom);
      console.log("[矩形绘制] 下边绘制完成");

      const lineLeft = new MxDbLine();
      lineLeft.pt1 = new THREE.Vector3(pt1.x, pt2.y, 0);
      lineLeft.pt2 = new THREE.Vector3(pt1.x, pt1.y, 0);
      lineLeft.color = new THREE.Color("#ff6600");
      lineLeft.setLineWidth(2);
      lineLeft.setLineWidthByPixels(true);
      mxObj.addMxEntity(lineLeft);
      console.log("[矩形绘制] 左边绘制完成");

      this.$Message.success("矩形绘制成功");
      this.currentCommand = "";
      console.log("[矩形绘制] 绘制完成");

    } catch (e) {
      console.error("[矩形绘制] 绘制失败:", e);
      this.$Message.error("绘制矩形失败: " + (e as Error).message);
      this.currentCommand = "";
    }
  }

  /**
   * 绘制文字
   */
  drawText() {
    this.executeCommand("BR_Text", "绘制文字");
  }

  /**
   * 绘制云线
   */
  drawCloudLine() {
    this.executeCommand("BR_CloudLine", "绘制云线");
  }

  /**
   * 绘制箭头
   */
  drawArrow() {
    this.executeCommand("BR_Arrow", "箭头批注");
  }

  /**
   * 引线标注
   */
  drawComment() {
    this.executeCommand("BR_Comment", "引线标注");
  }

  /**
   * 删除批注
   */
  deleteEntity() {
    this.executeCommand("Mx_DeleteEntity", "删除批注");
  }

  /**
   * 编辑文字
   */
  editText() {
    if (!this.viewerReady || !MxFun) {
      this.$Message.warning("查看器未就绪");
      return;
    }

    const mxObj = MxFun.getCurrentDraw();
    const aryId = mxObj.getMxCurrentSelect();

    if (aryId.length === 0) {
      this.$Message.warning("请先选中要编辑的文字或引线标注");
      return;
    }

    const ent = mxObj.getMxEntity(aryId[0]);
    const typeName = ent.getTypeName();

    // 判断是否是文字或引线标注
    if (typeName === "MxDbText" || typeName === "MyText") {
      this.editTextType = "文字";
      this.editTextValue = ent.text || "";
      this.editTextEntity = ent;
      this.showEditTextModal = true;
    } else if (typeName === "MxDbLeadComment") {
      this.editTextType = "引线标注";
      this.editTextValue = ent.text || "";
      this.editTextEntity = ent;
      this.showEditTextModal = true;
    } else {
      this.$Message.warning("请选中文字或引线标注");
    }
  }

  /**
   * 确认编辑文字
   */
  confirmEditText() {
    if (!this.editTextEntity) {
      this.$Message.error("实体不存在");
      return;
    }

    try {
      this.editTextEntity.text = this.editTextValue;
      this.editTextEntity.setNeedUpdateDisplay();
      this.$Message.success("文字修改成功");
      this.showEditTextModal = false;
      this.editTextEntity = null;
    } catch (e) {
      console.error("修改文字失败:", e);
      this.$Message.error("修改文字失败");
    }
  }

  /**
   * 取消编辑文字
   */
  cancelEditText() {
    this.showEditTextModal = false;
    this.editTextEntity = null;
  }

  // ============== 导出工具 ==============

  /**
   * 截图
   */
  takeScreenshot() {
    try {
      this.executeCommand("BR_WriteImage");
      this.$Message.success("截图已生成，请右键保存");
    } catch (e) {
      this.$Message.error("截图失败");
    }
  }

  /**
   * 打印
   */
  printView() {
    this.executeCommand("BR_Print");
  }

  /**
   * 保存批注
   */
  saveAnnotations() {
    this.executeCommand("Mx_SaveAllMxEntity");
    this.$Message.success("批注数据已保存");
  }

  // ============== 图层管理 ==============

  /**
   * 切换图层显示/隐藏
   */
  toggleLayer(layer: any, visible: boolean) {
    try {
      if (!this.mxcad || !layer || !layer.id) return;
      
      // 获取图层记录对象
      const record = layer.id.getMcDbLayerTableRecord();
      if (record) {
        // 设置图层是否关闭
        record.isOff = !visible;
        // 更新图层状态
        layer.off = !visible;
        console.log("切换图层:", layer.name, "显示:", visible);
        
        // 更新图层显示状态（关键！）
        if (this.mxcad.updateLayerDisplayStatus) {
          this.mxcad.updateLayerDisplayStatus();
        }
        
        // 触发重绘
        if (this.mxcad.updateDisplay) {
          this.mxcad.updateDisplay();
        } else if (MxFun && MxFun.updateDisplay) {
          MxFun.updateDisplay();
        }
      }
    } catch (e) {
      console.error("切换图层失败:", e);
    }
  }
  
  /**
   * 获取图层颜色
   */
  getLayerColor(colorValue: any): string {
    try {
      if (typeof colorValue === 'number') {
        return '#' + colorValue.toString(16).padStart(6, '0');
      }
      if (typeof colorValue === 'string') {
        // 如果是字符串，尝试解析
        if (colorValue.startsWith('#')) return colorValue;
        return '#' + colorValue;
      }
      return '#808080';
    } catch (e) {
      return '#808080';
    }
  }

  // ============== 通用方法 ==============

  /**
   * 执行命令
   */
  executeCommand(cmd: string, commandName?: string) {
    if (!this.viewerReady || !MxFun) {
      this.$Message.warning("查看器未就绪");
      return;
    }
    try {
      MxFun.sendStringToExecute(cmd);
      if (commandName) {
        this.currentCommand = commandName;
      }
      console.log("执行命令:", cmd);
    } catch (e) {
      console.error("执行命令失败:", e);
      this.$Message.error("命令执行失败");
    }
  }

  /**
   * 停止当前命令
   */
  stopCommand() {
    if (MxFun) {
      MxFun.stopRunCommand();
    }
    this.currentCommand = "";
  }

  /**
   * 切换面板收缩/展开
   */
  togglePanel() {
    this.panelCollapsed = !this.panelCollapsed;
  }

  /**
   * 初始化 Ctrl + 左键平移（事件模拟方式）
   * 把 Ctrl + 左键模拟成中键事件，完全复用 mxdraw 内部的平移逻辑
   */
  initCtrlPan() {
    const canvas = document.getElementById("mxcad") as HTMLCanvasElement;
    if (!canvas) {
      console.warn("[Ctrl平移] 未找到 canvas 元素");
      return;
    }

    console.log("[Ctrl平移] 初始化 Ctrl + 左键平移（事件模拟方式）");

    // 使用捕获阶段监听，这样可以在 mxdraw 处理之前拦截事件
    canvas.addEventListener("mousedown", this.handleCtrlPanMouseDown, true);
    canvas.addEventListener("mousemove", this.handleCtrlPanMouseMove, true);
    canvas.addEventListener("mouseup", this.handleCtrlPanMouseUp, true);
    canvas.addEventListener("mouseleave", this.handleCtrlPanMouseUp, true);
  }

  /**
   * 模拟中键事件
   */
  simulateMiddleButtonEvent(e: MouseEvent, type: string) {
    // 创建一个新的鼠标事件，把 button 改成 1（中键）
    const simulatedEvent = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: e.screenX,
      screenY: e.screenY,
      clientX: e.clientX,
      clientY: e.clientY,
      ctrlKey: false,  // 去掉 ctrlKey，避免 mxdraw 有特殊处理
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: 1,  // 中键
      buttons: 4,  // 中键按下的状态
      relatedTarget: e.relatedTarget as EventTarget
    });

    // 在 canvas 上派发模拟的事件
    const canvas = document.getElementById("mxcad") as HTMLCanvasElement;
    if (canvas) {
      canvas.dispatchEvent(simulatedEvent);
    }
  }

  /**
   * Ctrl + 左键平移 - 鼠标按下
   */
  handleCtrlPanMouseDown(e: MouseEvent) {
    // 只处理 Ctrl + 左键
    if (!e.ctrlKey || e.button !== 0) {
      return;
    }

    // 如果正在执行命令，不处理平移
    if (this.currentCommand) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    console.log("[Ctrl平移] 模拟中键按下");

    // 模拟中键按下事件
    this.simulateMiddleButtonEvent(e, "mousedown");

    // 改变光标样式
    const canvas = document.getElementById("mxcad") as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = "grabbing";
    }
  }

  /**
   * Ctrl + 左键平移 - 鼠标移动
   */
  handleCtrlPanMouseMove(e: MouseEvent) {
    // 只处理 Ctrl + 左键按下的情况
    if (!e.ctrlKey || e.buttons !== 1) {
      return;
    }

    // 如果正在执行命令，不处理平移
    if (this.currentCommand) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // 模拟中键移动事件
    this.simulateMiddleButtonEvent(e, "mousemove");
  }

  /**
   * Ctrl + 左键平移 - 鼠标释放
   */
  handleCtrlPanMouseUp(e: MouseEvent) {
    // 只处理 Ctrl + 左键释放的情况
    if (!e.ctrlKey || e.button !== 0) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    console.log("[Ctrl平移] 模拟中键释放");

    // 模拟中键释放事件
    this.simulateMiddleButtonEvent(e, "mouseup");

    // 恢复光标样式
    const canvas = document.getElementById("mxcad") as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = "";
    }
  }

  /**
   * 销毁查看器
   */
  destroyViewer() {
    try {
      if (this.mxcad && this.mxcad.destroy) {
        this.mxcad.destroy();
      }
      this.mxcad = null;
      this.mxDraw = null;
      this.viewerReady = false;
      this.currentCommand = "";
      this.measureResult = "";
    } catch (e) {
      console.warn("销毁查看器时出错:", e);
    }
  }
}
</script>

<style scoped>
.iv-cad-viewer {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  overflow: hidden;
}

/* 顶部导航栏 */
.iv-cad-viewer .header-bar {
  height: 48px;
  /* background: linear-gradient(90deg, #52c41a, #73d13d); */
  background: #1764e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  color: #fff;
  flex-shrink: 0;
}

.iv-cad-viewer .header-bar .header-left {
  display: flex;
  align-items: center;
}

.iv-cad-viewer .header-bar .header-left .logo {
  height: 28px;
  margin-right: 12px;
}

.iv-cad-viewer .header-bar .header-left .title {
  font-size: 18px;
  font-weight: 600;
  margin-right: 12px;
}

/* 主内容区 */
.iv-cad-viewer .main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧面板 */
.iv-cad-viewer .left-panel {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e8eaed;
  overflow-y: auto;
  flex-shrink: 0;
  position: relative;
  transition: width 0.3s ease;
}

/* 收缩状态 */
.iv-cad-viewer .left-panel.collapsed {
  width: 40px;
  overflow: hidden;
}

/* 收缩/展开按钮 */
.iv-cad-viewer .left-panel .panel-toggle-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  border-radius: 4px;
  cursor: pointer;
  z-index: 10;
  color: #666;
  transition: all 0.3s ease;
}

.iv-cad-viewer .left-panel .panel-toggle-btn:hover {
  background: #e8eaed;
  color: #333;
}

.iv-cad-viewer .left-panel.collapsed .panel-toggle-btn {
  right: 50%;
  transform: translateX(50%);
  top: 12px;
}

/* 面板内容 */
.iv-cad-viewer .left-panel .panel-content {
  padding-top: 8px;
}

.iv-cad-viewer .left-panel .panel-section {
  margin-bottom: 12px;
}

.iv-cad-viewer .left-panel .tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: center;
}

/* 测量结果 */
.iv-cad-viewer .measure-result {
  margin-top: 12px;
}

/* 右侧 Viewer */
.iv-cad-viewer .right-panel {
  flex: 1;
  position: relative;
  background: #000;
}

.iv-cad-viewer .right-panel .viewer-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.iv-cad-viewer .right-panel .viewer-container canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* 加载遮罩 */
.iv-cad-viewer .right-panel .loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.iv-cad-viewer .right-panel .loading-overlay .loading-content {
  text-align: center;
  color: #fff;
}

.iv-cad-viewer .right-panel .loading-overlay .loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #52c41a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.iv-cad-viewer .right-panel .loading-overlay .loading-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.iv-cad-viewer .right-panel .loading-overlay .loading-step {
  font-size: 13px;
  color: #999;
  margin-bottom: 16px;
}

.iv-cad-viewer .right-panel .loading-overlay .loading-progress {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.iv-cad-viewer .right-panel .loading-overlay .progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #52c41a, #73d13d);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 当前命令提示 */
.iv-cad-viewer .right-panel .command-tip {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 50;
}

/* 底部状态栏 */
.iv-cad-viewer .status-bar {
  height: 28px;
  background: #fff;
  border-top: 1px solid #e8eaed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

.iv-cad-viewer .status-bar .status-left,
.iv-cad-viewer .status-bar .status-right {
  display: flex;
  align-items: center;
}

.iv-cad-viewer .status-bar .status-item {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.iv-cad-viewer .status-bar .status-item .ivu-icon {
  margin-right: 4px;
}

.iv-cad-viewer .status-bar .status-item .status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4d4f;
  margin-right: 4px;
}

.iv-cad-viewer .status-bar .status-item .status-dot.ready {
  background: #52c41a;
}

/* 图层列表 */
.iv-cad-viewer .layer-list {
  max-height: 400px;
  overflow-y: auto;
}

.iv-cad-viewer .layer-list .layer-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.iv-cad-viewer .layer-list .layer-item:last-child {
  border-bottom: none;
}

.iv-cad-viewer .layer-list .layer-color {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  margin-right: 8px;
  vertical-align: middle;
  border: 1px solid #e8e8e8;
}

.iv-cad-viewer .layer-list .empty-tip {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

/* 图层数量 */
.iv-cad-viewer .layer-count {
  text-align: center;
  padding: 16px 0;
}

.iv-cad-viewer .layer-count .count {
  font-size: 28px;
  font-weight: 600;
  color: #52c41a;
}

.iv-cad-viewer .layer-count .label {
  font-size: 14px;
  color: #666;
  margin-left: 4px;
}

/* 图层列表面板 */
.iv-cad-viewer .layer-list-panel {
  margin-top: 8px;
  border-top: 1px solid #e8e8e8;
  padding-top: 12px;
}

.iv-cad-viewer .layer-list-header {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
  text-align: center;
}

.iv-cad-viewer .layer-list-scroll {
  max-height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
}

.iv-cad-viewer .layer-item-row {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 13px;
}

.iv-cad-viewer .layer-item-row:hover {
  background-color: #f0f7ff;
}

.iv-cad-viewer .layer-item-row.layer-off {
  opacity: 0.5;
}

.iv-cad-viewer .layer-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
  border: 1px solid #ddd;
}

.iv-cad-viewer .layer-name-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #333;
}

.iv-cad-viewer .layer-eye-icon {
  font-size: 14px;
  color: #999;
  margin-left: 8px;
  flex-shrink: 0;
}

.iv-cad-viewer .layer-empty {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 16px 0;
}

/* 帮助内容 */
.iv-cad-viewer .help-content h4 {
  margin-top: 16px;
  margin-bottom: 8px;
  color: #333;
}

.iv-cad-viewer .help-content ul {
  padding-left: 20px;
}

.iv-cad-viewer .help-content ul li {
  margin-bottom: 6px;
  line-height: 1.6;
}

.iv-cad-viewer .help-content p {
  line-height: 1.6;
  color: #666;
}

/* 编辑文字表单 */
.edit-text-form .form-item {
  margin-bottom: 16px;
}

.edit-text-form .form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
