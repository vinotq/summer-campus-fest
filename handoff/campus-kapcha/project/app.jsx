/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard, DCPostIt,
   StartScreen, Grid3x3Screen, TilesScreen, SliderScreen, AudioScreen,
   ImageCodeScreen, ScoreToastScreen, ResultScreen,
   AdminLoginScreen, AdminPlayersScreen, AdminQuestionsScreen,
   DashboardScreen */

function App() {
  return (
    <DesignCanvas>
      <DCSection
        id="player"
        title="Игрок · мобильный поток"
        subtitle="iPhone, 390×844. От ввода имени до сертификата. Узкий «капчевый» UI, фестивальный знак в шапке и в результате."
      >
        <DCArtboard id="p-start"   label="01 · Старт"                width={390} height={844}><StartScreen /></DCArtboard>
        <DCArtboard id="p-grid"    label="02 · grid3×3 — продукты"   width={390} height={844}><Grid3x3Screen /></DCArtboard>
        <DCArtboard id="p-tiles"   label="03 · tiles — клетки на фото" width={390} height={844}><TilesScreen /></DCArtboard>
        <DCArtboard id="p-slider"  label="04 · slider — поставить объект ★" width={390} height={844}><SliderScreen /></DCArtboard>
        <DCArtboard id="p-audio"   label="05 · audio — транскрипция" width={390} height={844}><AudioScreen /></DCArtboard>
        <DCArtboard id="p-code"    label="06 · imageCode"           width={390} height={844}><ImageCodeScreen /></DCArtboard>
        <DCArtboard id="p-score"   label="07 · промежуточный +80"    width={390} height={844}><ScoreToastScreen /></DCArtboard>
        <DCArtboard id="p-result"  label="08 · Результат + сертификат" width={390} height={844}><ResultScreen /></DCArtboard>
      </DCSection>

      <DCSection
        id="admin"
        title="Админ · десктоп"
        subtitle="1280×820. Плотная таблица игроков, редактор вопросов с воздухом."
      >
        <DCArtboard id="a-login"   label="09 · /admin/login"    width={1100} height={680}><AdminLoginScreen /></DCArtboard>
        <DCArtboard id="a-players" label="10 · /admin/players"  width={1280} height={820}><AdminPlayersScreen /></DCArtboard>
        <DCArtboard id="a-quest"   label="11 · /admin/questions — редактор slider ★" width={1280} height={820}><AdminQuestionsScreen /></DCArtboard>
      </DCSection>

      <DCSection
        id="public"
        title="Дашборд · проектор"
        subtitle="1920×1080. Анимированный leaderboard топ-10, фон-знак, QR для входа."
      >
        <DCArtboard id="d-top10" label="12 · /dashboard — топ-10" width={1920} height={1080}><DashboardScreen /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
