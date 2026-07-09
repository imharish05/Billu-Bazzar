'use strict';
const cron = require('node-cron');

const recalculateTrending = async () => {
  try {
    const { SearchKeyword, TrendingCache } = require('../models');
    
    // Fetch all keywords
    const keywords = await SearchKeyword.findAll();
    
    for (const kw of keywords) {
      // Compute score
      const score = (kw.search_count_today * 0.7) + (kw.search_count_week * 0.3);
      
      // Decay counts: weekly decayed by 0.75 + today's count, today's count reset to 0
      const newWeekCount = Math.round(kw.search_count_week * 0.75) + kw.search_count_today;
      
      await kw.update({
        trending_score: score,
        search_count_week: newWeekCount,
        search_count_today: 0
      });
    }

    // Query top 10
    const topKeywords = await SearchKeyword.findAll({
      order: [
        ['is_trending', 'DESC'],
        ['trending_score', 'DESC'],
        ['search_count', 'DESC']
      ],
      limit: 10,
      attributes: ['keyword']
    });

    const list = topKeywords.map(k => k.keyword);

    // Cache results
    await TrendingCache.destroy({ where: {} });
    await TrendingCache.create({ data: list });

    console.log('[Cron] Recalculated and cached top 10 trending keywords:', list);
  } catch (err) {
    console.error('[Cron] Error recalculating trending keywords:', err.message);
  }
};

// Daily check at 1:00 AM
cron.schedule('0 1 * * *', recalculateTrending);

// Initial calculation on job load if cache is empty
const initTrendingCache = async () => {
  try {
    const { TrendingCache } = require('../models');
    const count = await TrendingCache.count();
    if (count === 0) {
      console.log('[Cron] Initializing empty trending cache...');
      await recalculateTrending();
    }
  } catch (err) {
    console.error('[Cron] Initial cache setup failed:', err.message);
  }
};

setTimeout(initTrendingCache, 5000); // delay to let DB sync settle

module.exports = { recalculateTrending };
