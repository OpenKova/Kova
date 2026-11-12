import type { FirstRunCopy } from './types_first_run'

export const jaFirstRun: FirstRunCopy = {
  account: {
    title: 'Kova アカウントを作成',
    description: 'Google を使って Kova プロフィールを作成し、ユーザー名を設定します。AI モデルプロバイダーへのサインインとは別のものです。',
    privacy: 'Kova ID、メールアドレス、ユーザー名がデバイス間で同期されます。チャット、モデルへのアクセス、エージェントプロフィールはこのデバイスに保存されます。',
    signIn: 'Google で続行',
    username: 'ユーザー名を設定',
    usernamePlaceholder: 'your_name',
    usernameHint: '3～24 文字の英字、数字、アンダースコアを使用してください。ユーザー名は一意です。',
    saveUsername: 'ユーザー名を保存',
    continue: 'セットアップを続ける',
    notNow: '今はしない',
    working: '処理中…',
    signOut: 'ログアウト',
    unavailable: 'このビルドでは Kova アカウントをまだ設定できません。'
  },
  beats: {
    name: '名前',
    theme: 'アクセントカラー',
    layout: 'レイアウト',
    connectors: 'アプリ',
    plugins: 'プラグイン',
    tour: 'ツアー',
    build: '最初のタスク'
  },
  namePlaceholder: 'あなたの名前',
  useName: name => `「${name}」を使う`,
  install: 'インストール',
  installed: 'インストール済み',
  loading: '読み込み中…',
  noPlugins: '現在表示できるプラグインはありません。',
  noneChosen: 'なし',
  noAnswer: '回答なし',
  answerRefused: '回答は受け付けられませんでした',
  tours: {
    quick: 'クイックツアー',
    full: 'すべて見せて',
    skip: 'スキップして何か作ろう'
  },
  skippedAll: 'セットアップをスキップしました',
  skip: 'セットアップをスキップ',
  skipTip: 'ガイド付きセットアップを終了し、新しいチャットを開きます。',
  skipFailed: 'セットアップをスキップできませんでした',
  slashOffTitle: 'セットアップ中はスラッシュコマンドを使えません',
  slashOffBody: 'セットアップが終わると通常どおり使えます。',
  localModel: {
    title: 'このコンピューターはモデルをローカルで実行できます',
    text: (model, size) =>
      `${model}（${size}）はお使いのハードウェアに適しています。無料で動作し、チャットはこのコンピューターから出ません。`,
    setUp: 'セットアップする',
    notNow: '今はしない'
  },
  intro: {
    greeting: 'こんにちは、Kova です。',
    plan: 'まずはあなたに合わせて設定しましょう。そのあと、何かすごいものを作りましょう。'
  },
  rerun: {
    title: 'オンボーディングをもう一度実行',
    description: '現在のモデルで初回セットアップの手順をたどる、新しいセットアップチャットを開きます。',
    action: 'もう一度実行',
    failed: 'オンボーディングを開始できませんでした'
  }
}
