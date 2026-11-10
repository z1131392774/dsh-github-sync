# 决策记录：采用 agents-template 指令体系

*[English](2026-11-10-adopt-agents-template.md)*

Status: implemented —— 层级、推送前技能、文档门禁、双语配对。

## 问题

仓库攒下了用户手册、安装教程、发布清单、发布说明，却没有规矩说清谁管什么。指令只活在维护者的习惯里，新来的 agent 只能从代码反推；还有些事实该放在强制它们的代码旁边，却留在 README 里。每篇文档又只有一个语言版本，另一种语言的读者读到的是一份过时摘要，或者什么都没有。

## 决定

仓库照 [agents-template](https://github.com/z1131392774/agents-template) 组织：根部一份简短的 [`AGENTS.md`](../../../AGENTS.md)，下一层的标准放在 [`docs/AGENTS.md`](../../../docs/AGENTS.md)，按条件触发的流程收在 [`.agents/skills/`](../../skills/pre-push-checks/SKILL.md)，决策记录收在 [`.agents/notes/`](../README.md)。

文档双语。英文是源；每篇文档旁边放一个中文孪生文件 `<name>_zh.md`，两份互相链接；孪生文件缺失、没链上、超预算，[`scripts/check-docs.mjs`](../../../scripts/check-docs.mjs) 就让构建失败。面向用户的手册从 `README.md` 搬进 [`docs/usage.md`](../../../docs/usage.md)、[`docs/how-it-works.md`](../../../docs/how-it-works.md)、[`docs/troubleshooting.md`](../../../docs/troubleshooting.md)，README 只留一个落地页。

## 考虑过的备选方案

**手册留在 `README.md`，整篇翻译。** 一种语言一个文件，浏览省事；但 README 是插件市场渲染的页面，也是 npm 安装后展示的页面，三千字的手册搁这儿会埋掉安装步骤。拆开也让两半各自拿到相称的预算和读者。

**中文做源，英文做孪生。** 否了：代码、提交历史、上游项目都以英文为先，翻译这半又最可能出自 agent 之手。

**漏翻靠评审抓。** 只改英文的 diff 里，缺失的 `_zh` 文件看不见——错得悄无声息，还会累积，正是门禁该揽的活。

## 后果

现在每改一次文档都要动两个文件；事实改了，译者若意译而不照办，两份就会漂移。门禁管缺失和断链，管不了意思；意思仍是评审的活，[`docs/AGENTS.md`](../../../docs/AGENTS.md#bilingual-documents) 说得明白。

`CHANGELOG.md` 和 `RELEASE_NOTES.md` 豁免：它们记的是提交，翻译过的提交日志会偏离 git 实际记下的东西。
