let express = require('express'),
    logger = require('./logger')
;

let app = express();
app.set('port', process.env.PORT || 3000);

app.get('/', (req, res) => {
    res.render('<h1>Home Page.</h1>');
});

app.listen(app.get('port'), '0.0.0.0', () => {
    logger.info(`Express started on http://localhost:${app.get('port')}; press Ctrl-C to terminate.`);
    logger.debug(`Express started on http://localhost:${app.get('port')}; press Ctrl-C to terminate.`);
    logger.warn(`Express started on http://localhost:${app.get('port')}; press Ctrl-C to terminate.`);
    logger.error(`Express started on http://localhost:${app.get('port')}; press Ctrl-C to terminate.`);
});
