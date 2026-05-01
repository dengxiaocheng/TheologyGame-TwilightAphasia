# 失语的黄昏 / Twilight of Aphasia

> *"来吧，我们要建造一座城和一座塔，塔顶通天。"*

巴别塔主题的神学微游戏。在语言混乱的黄昏中，名字是唯一的锚点。

## 在线试玩

**GitHub Pages**: [https://dengxiaocheng.github.io/TheologyGame-TwilightAphasia/](https://dengxiaocheng.github.io/TheologyGame-TwilightAphasia/)

## 本地运行

无需构建步骤，直接用浏览器打开：

```bash
# 方式一：直接打开
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows

# 方式二：本地服务器（推荐）
npx serve .
# 或
python3 -m http.server 8000
```

## 项目结构

```
index.html          静态入口
js/main.js          游戏入口脚本
plan/               设计文档与修复计划
test.mjs            Playwright 玩法测试
```

## 技术栈

- 纯 HTML / CSS / JavaScript，无框架依赖
- 移动端优先触控交互
- GitHub Pages 静态部署
