const articles = require('./articles')
const { getOptions } = require('./options')

module.exports = {
  articles: getOptions(articles)
}
