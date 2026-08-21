<template>
  <div class="iv-cad-viewer">
    <!-- 顶部导航栏 -->
    <div class="header-bar">
      <div class="header-left">
        <img src="https://www.iviewui.com/images/logo.png" alt="logo" class="logo" />
        <span class="title">DWG MxCAD 查看器</span>
        <Tag color="green" size="small">mxdraw - 梦想凯德 CAD</Tag>
      </div>
      <div class="header-right">
        <Button type="primary" size="small" icon="md-help" @click="showHelp = true">使用帮助</Button>
      </div>
    </div>

    <div class="main-content">
      <!-- 左侧控制面板 -->
      <div class="left-panel">
        <!-- 文件加载 -->
        <Card title="文件加载" icon="md-folder-open" :bordered="false">
          <div class="panel-section">
            <Upload
              action=""
              :before-upload="handleBeforeUpload"
              accept=".mxweb"
              :show-upload-list="false"
            >
              <Button type="primary" icon="md-cloud-upload" long>上传 .mxweb 文件</Button>
            </Upload>
            <p class="tip">支持 .mxweb 格式（需先转换）</p>
          </div>

          <div class="panel-section">
            <Button icon="md-document" long @click="loadExample">加载示例图纸</Button>
          </div>

          <Divider>或</Divider>

          <div class="panel-section">
            <Input v-model="fileUrlInput" placeholder="输入 .mxweb 文件 URL" />
            <Button type="primary" icon="md-play" long style="margin-top: 8px" @click="loadFromUrl">
              从 URL 加载
            </Button>
          </div>
        </Card>

        <!-- DWG 转换 -->
        <Card title="DWG 转换" icon="md-swap" :bordered="false">
          <Alert type="warning" show-icon size="small">
            DWG 文件需先转换为 .mxweb 格式
          </Alert>
          <div class="panel-section">
            <Upload
              action=""
              :before-upload="handleConvertUpload"
              accept=".dwg"
              :show-upload-list="false"
            >
              <Button icon="md-refresh" long>上传 DWG 并转换</Button>
            </Upload>
          </div>
        </Card>

        <!-- 视图控制 -->
        <Card title="视图控制" icon="md-construct" :bordered="false">
          <Row :gutter="8">
            <Col span="12">
              <Button icon="md-resize" long @click="zoomAll">适应窗口</Button>
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
        </Card>

        <!-- 测量工具 -->
        <Card title="测量工具" icon="md-ruler" :bordered="false">
          <Row :gutter="8">
            <Col span="12">
              <Button icon="md-code-working" long @click="startMeasure">距离测量</Button>
            </Col>
            <Col span="12">
              <Button icon="md-square-outline" long @click="startAreaMeasure">面积测量</Button>
            </Col>
          </Row>
          <Row :gutter="8" style="margin-top: 8px">
            <Col span="12">
              <Button icon="md-camera" long @click="takeScreenshot">截图保存</Button>
            </Col>
            <Col span="12">
              <Button icon="md-list" long @click="showLayers = true">图层列表</Button>
            </Col>
          </Row>
        </Card>

        <!-- 图层信息 -->
        <Card title="图层信息" icon="md-layers" :bordered="false">
          <div class="layer-count">
            <span class="count">{{ layerCount }}</span>
            <span class="label">个图层</span>
          </div>
          <Button type="link" @click="showLayers = true">查看详情</Button>
        </Card>
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
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="status-bar">
      <div class="status-left">
        <span class="status-item">
          <Icon type="md-document" />
          {{ fileName || '图纸未加载' }}
        </span>
        <span class="status-item">
          <Icon type="md-layers" />
          {{ layerCount }} 个图层
        </span>
      </div>
      <div class="status-right">
        <span class="status-item">
          <Icon type="md-code-working" />
          引擎: MxCAD (mxcad)
        </span>
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
          v-for="layer in layers"
          :key="layer.id"
          class="layer-item"
        >
          <Checkbox
            :checked="!layer.off"
            @on-change="toggleLayer(layer.id, $event)"
          >
            <span
              class="layer-color"
              :style="{ backgroundColor: '#' + layer.colorValue.toString(16).padStart(6, '0') }"
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
          <li><strong>鼠标左键</strong>：选择实体</li>
          <li><strong>鼠标右键</strong>：结束命令 / 取消选择</li>
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
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { createMxCad, MxCpp } from "mxcad";
import { MxFun } from "mxdraw";

@Component
export default class IvCadViewer extends Vue {
  // 文件 URL
  fileUrlInput = "./HDMY-XJH.mxweb";
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

  mounted() {
    this.initViewer();
  }

  beforeDestroy() {
    this.destroyViewer();
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
        fileUrl: "./HDMY-XJH.mxweb",
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

      this.viewerReady = true;
      this.loading = false;
      this.loadingProgress = 100;
      this.fileName = "HDMY-XJH.mxweb";

      this.$Message.success("MxCAD 查看器初始化成功");

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
  }

  /**
   * 加载示例图纸
   */
  loadExample() {
    this.fileUrlInput = "./demo/test2.mxweb";
    this.loadFromUrl();
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

      mxcad.mxdraw.on("openFileComplete", () => {
        this.onFileLoaded();
      });

      mxcad.mxdraw.on("uiSetLayerData", (listLayer: any[]) => {
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

  /**
   * 上传前处理
   */
  handleBeforeUpload(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      // TODO: 处理本地文件
      this.$Message.info("本地文件加载功能开发中");
    };
    reader.readAsArrayBuffer(file);
    return false;
  }

  /**
   * 转换上传
   */
  handleConvertUpload(file: File) {
    this.$Message.info("DWG 转换功能需要后端服务支持");
    return false;
  }

  /**
   * 缩放至全图
   */
  zoomAll() {
    if (this.mxDraw) {
      this.mxDraw.zoomAll();
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
   * 开始测量
   */
  startMeasure() {
    this.$Message.info("距离测量功能开发中");
  }

  /**
   * 面积测量
   */
  startAreaMeasure() {
    this.$Message.info("面积测量功能开发中");
  }

  /**
   * 截图
   */
  takeScreenshot() {
    this.$Message.info("截图功能开发中");
  }

  /**
   * 切换图层
   */
  toggleLayer(layerId: number, visible: boolean) {
    if (this.mxDraw && MxFun) {
      MxFun.showLayer(layerId, visible, false);
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
  background: linear-gradient(90deg, #52c41a, #73d13d);
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
