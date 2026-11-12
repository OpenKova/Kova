import type { FirstRunCopy } from './types_first_run'

export const zhHantFirstRun: FirstRunCopy = {
  account: {
    title: '建立 Kova 帳戶',
    description: '使用 Google 建立 Kova 個人資料並設定使用者名稱。這與 AI 模型供應商的登入彼此獨立。',
    privacy: 'Kova 身分、電子郵件和使用者名稱會在裝置間同步。聊天、模型存取權和代理個人資料僅保留在此裝置。',
    signIn: '使用 Google 繼續',
    username: '選擇使用者名稱',
    usernamePlaceholder: '你的名稱',
    usernameHint: '使用 3–24 個字母、數字或底線。使用者名稱必須唯一。',
    saveUsername: '儲存使用者名稱',
    continue: '繼續設定',
    notNow: '暫時不要',
    working: '處理中…',
    signOut: '登出',
    unavailable: '此版本目前尚未提供 Kova 帳戶設定。'
  },
  beats: {
    name: '名字',
    theme: '強調色',
    layout: '版面配置',
    connectors: '應用程式',
    plugins: '外掛',
    tour: '導覽',
    build: '第一個任務'
  },
  namePlaceholder: '你的名字',
  useName: name => `使用「${name}」`,
  install: '安裝',
  installed: '已安裝',
  loading: '正在載入…',
  noPlugins: '目前沒有可顯示的外掛。',
  noneChosen: '無',
  noAnswer: '未回答',
  answerRefused: '未接受該回答',
  tours: {
    quick: '快速導覽',
    full: '全部展示給我',
    skip: '略過，來做點東西'
  },
  skippedAll: '已略過設定',
  skip: '略過設定',
  skipTip: '結束引導設定並開啟新對話。',
  skipFailed: '無法略過設定',
  slashOffTitle: '設定期間無法使用斜線指令',
  slashOffBody: '設定完成後即可照常使用。',
  localModel: {
    title: '這部電腦可以在本機執行模型',
    text: (model, size) => `${model}（${size}）適合你的硬體。它免費執行，你的對話會留在這部電腦上。`,
    setUp: '設定',
    notNow: '暫時不要'
  },
  intro: {
    greeting: '你好，我是 Kova。',
    plan: '我們先幫你把一切設定好，然後一起做點很酷的事。'
  },
  rerun: {
    title: '重新執行新手引導',
    description: '開啟新的設定對話，用你目前的模型走一遍首次執行的步驟。',
    action: '重新執行',
    failed: '無法啟動新手引導'
  }
}
