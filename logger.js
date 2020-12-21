let appRoot = require('app-root-path'),
    winston = require('winston'),
    winstonDaily = require('winston-daily-rotate-file'),
    process = require('process'),
    path = require('path')
;

const {combine, timestamp, printf, colorize, label} = winston.format;
const logFormat = printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level} ${info.message}`;
});

const logDir = `${appRoot}/logs`;
const options = {
    info: {
        level: 'info',
        dirname: logDir,
        filename: 'your-log-filename-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        handleExceptions: true,
        json: false,
        maxsize: '20m',    /* 20MB */
        maxFiles: 60,      /* 2달치까지만 남긴다. */
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true,
        format: combine(
            label({label: 'dev'.toUpperCase()}),
            timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSSZ'}),
            colorize(),
            logFormat,
        )
    },
    error: {
        level: 'error',
        dirname: logDir,
        filename: 'your-error-log-filename-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        handleExceptions: true,
        json: false,
        maxsize: '40m',    /* 40MB */
        maxFiles: 60,      /* 2달치까지만 남긴다. */
    },
}

let logger = new winston.createLogger({
    format: combine(
        label({label: 'prod'.toUpperCase()}),
        timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSSZ'}),
        logFormat,
    ),
    transports: [],
    exitOnError: false,
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console(options.console));
} else {
    logger.add(new winstonDaily(options.info));
    logger.add(new winstonDaily(options.error));
}

module.exports.debug = module.exports.log = message => {
    arguments[0] = message;
    logger.debug.apply(logger, formatLogArguments(arguments))
}

module.exports.info = message => {
    arguments[0] = message;
    logger.info.apply(logger, formatLogArguments(arguments))
}

module.exports.warn = message => {
    arguments[0] = message;
    logger.warn.apply(logger, formatLogArguments(arguments))
}

module.exports.error = message => {
    arguments[0] = message;
    logger.error.apply(logger, formatLogArguments(arguments))
}

/* winston 에 [filename:line] 표시하기 참조사이트:
 * https://m.blog.naver.com/PostView.nhn?blogId=sipzirala&logNo=221280917672&proxyReferer=https:%2F%2Fwww.google.com%2F */
const formatLogArguments = args => {
    args = Array.prototype.slice.call(args);

    let stackInfo = getStackInfo(1);
    if (stackInfo) {
        // get file path relative to project root
        let calleeStr = '[' + stackInfo.relativePath + ':' + stackInfo.line + '] -';

        if (typeof (args[0]) === 'string') {
            args[0] = calleeStr + ' ' + args[0];
        } else {
            args.unshift(calleeStr);
        }
    }

    return args;
}

const getStackInfo = stackIndex => {
    // get call stack, and analyze it
    // get all file, method, and line numbers
    let stackList = (new Error()).stack.split('\n').slice(3);

    // stack trace format:
    // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
    // do not remove the regex expresses to outside of this method (due to a BUG in node.js)
    let stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
    let stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

    let s = stackList[stackIndex] || stackList[0];
    let sp = stackReg.exec(s) || stackReg2.exec(s);

    if (sp && sp.length === 5) {
        return {
            method: sp[1],
            relativePath: path.relative("" + appRoot, sp[2]),
            line: sp[3],
            pos: sp[4],
            file: path.basename(sp[2]),
            stack: stackList.join('\n')
        }
    }
}
