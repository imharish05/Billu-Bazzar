const { SiteSetting } = require('./models');

async function check() {
  const s = await SiteSetting.findOne({ where: { key: 'loyalty' }});
  if (s) {
    console.log(s.value);
  } else {
    console.log("No settings found");
  }
}
check();
