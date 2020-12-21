# winston-logging-starter
> node.js 에서 사용하는 로깅 모듈인 winston 사용을 정리

## winston
> node.js 에서 사용하는 로깅 모듈  
> 설치: `npm i winston`   

### 기초 사용법
> ```javascript
> let winston = require('winston');
> 
> winston.log('info', 'Hello World');
> winston.info('Hello World');
> ```

## 커스텀
### logger 인스턴스 설정
> `logger.js` 파일에 logger 인스턴스 모듈 셋팅하기  
> 
> * winston.format 하위 함수들 선언  
> 아래와 같이 정의하면 `winston.format.combine()` 으로 사용해야할 것을 `combine()` 으로 사용할 수 있다.
> ```javascript
> const {combine, timestamp, printf, colorize, label} = winston.format;
> ```
> 
> * 화면 혹은 파일에 출력할 로그 형식 정의
> ```javascript
> const logFormat = printf(info => {
>     return `${info.timestamp} [${info.label}] ${info.level} ${info.message}`;
> });
> ```
> 
> * 각각 파일 출력, 콘솔 출력, 에러 파일 출력에 인스턴스에 사용할 옵션 값 정의  
>   - level (string): 로그 레벨(error, warn, info, http, verbose, debug, silly)  
>   - dirname (string): 파일 출력 시 해당 파일이 위치할 디렉터리 이름  
>   - filename (string): 파일 출력 시 출력 파일 이름 `%DATE%`를 통해서 .log 와 파일 이름 사이에 날짜를 출력하도록 할 수 있다.
>   - handleExceptions (bool): uncaught exception 이 로그로 출력된다.
>           이 옵션 값을 true 시 원래는 `logger.exceptions.handle(new winstonDaily(options.error));` 로 추가해야하는 것을 
>           `logger.add(new winstonDaily(options.error));` 로 추가할 수 있게 해준다. (끝까지 읽어보고 다시 보기.)
>   - json (bool): json 형식 출력
>   - maxsize (number): 파일 1개당 최대 사이즈 숫자만 쓰면 byte 단위, MB 혹은 KB 사용을 원하면 '20m', '20k' 이런 식으로 입력 가능
>   - maxFiles (number): 최대 사이즈를 찍으면 로그 파일이 다른 이름으로 새로 만들어진다. 그 때 최대 몇 개 까지 만들지 정한다.
>           Daily Log 를 하게 되면 몇 일 치를 남길 것인가로 봐도 됨.
>   - format (object): 로그에 출력할 label 및 timestamp, color 로그 출력, 로그 형식 등을 지정한다.
> 
> ```javascript
> const options = {
>     file: {
>         level: 'info',
>         dirname: logDir,
>         filename: 'your-log-filename-%DATE%.log',
>         datePattern: 'YYYY-MM-DD',
>         handleExceptions: true,
>         json: false,
>         maxsize: '20m',    /* 20MB */
>         maxFiles: 60,      /* 2달치까지만 남긴다. */
>     },
>     console: {
>         level: 'debug',
>         handleExceptions: true,
>         json: false,
>         colorize: true,
>         format: combine(
>             label({label: 'dev'.toUpperCase()}),
>             timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSSZ'}),
>             colorize(),
>             logFormat,
>         )
>     },
>     error: {
>         level: 'error',
>         dirname: logDir,
>         filename: 'your-error-log-filename-%DATE%.log',
>         datePattern: 'YYYY-MM-DD',
>         handleExceptions: true,
>         json: false,
>         maxsize: '40m',    /* 40MB */
>         maxFiles: 60,      /* 2달치까지만 남긴다. */
>     },
> }
> ```
> 
> * `logger` 인스턴스 생성 및 export
>  - transports (array): 위에서 정의한 option 을 통해 info 파일, error 파일, 콘솔에 출력하기 위한 설정을 담은 로그 인스턴스의 모음.
>     운영 환경(production)과 개발 환경(development) 에 따라서 추가할 로그 설정이 다르기 때문에 비어져 있는 상태로 초기화 하였다.
>  - exitOnError (bool): false 인 경우 exception 이 process.exit 을 일으키지 않는다. 
> ```javascript
> let logger = new winston.createLogger({
>       format: combine(
>           label({label: 'prod'.toUpperCase()}),
>           timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSSZ'}),
>           logFormat,
>       ),
>       transports: [],
>       exitOnError: false,
> });
> 
> if (process.env.NODE_ENV !== 'production') {
>       logger.add(new winston.transports.Console(options.console));
> } else {
>       logger.add(new winston.transports.File(options.info));
>       logger.add(new winston.transports.File(options.error));
> }
> 
> module.exports = logger;
> ```

### Daily Logging
> winston-daily-rotate-file 모듈을 사용 Daily Logging 설정을 한다.     
> 설치: `npm i winston-daily-rotate-file`  
> 적용:
> ```javascript
> let winstonDaily = require('winston-daily-rotate-file');
> ...
> if (process.env.NODE_ENV !== 'production') {
>     logger.add(new winston.transports.Console(options.console));
> } else {
>     logger.add(new winstonDaily(options.info));   /* winston.transports.File -> winstonDaily 로 변경 */
>     logger.add(new winstonDaily(options.error));  /* winston.transports.File -> winstonDaily 로 변경 */
> }
> ```

### 로그에 파일이름:라인 넘버 출력하기
> 일부러 Error 를 발생 시켜서 logger.info() 와 같이 로그 함수를 출력한 부분의 파일 이름 및 라인 넘버를 알아낸 다음에 아래 추가한 함수들을
> 통해서 추출해서 로그에 출력한다. 로깅 함수를 호출 할 때 마다 Error 를 일으키고 해당 파일 및 라인 넘버를 가져오는 연산을 하기 때문에 
> 성능에 악영향을 많이 끼치지 않을까 걱정이 되긴 한다. (실제로 악영향을 많이 끼치지는지는 잘 모르겠다.)    
> `logger.js`에 다음 함수들 추가  
> ```javascript
>  const formatLogArguments = args => {
>     args = Array.prototype.slice.call(args);
>
>     let stackInfo = getStackInfo(1);
>     if (stackInfo) {
>           // get file path relative to project root
>           let calleeStr = '[' + stackInfo.relativePath + ':' + stackInfo.line + '] -';
>     
>           if (typeof (args[0]) === 'string') {
>                 args[0] = calleeStr + ' ' + args[0];
>           } else {
>                 args.unshift(calleeStr);
>           }
>     }
>
>     return args;
> }
> 
> const getStackInfo = stackIndex => {
>     // get call stack, and analyze it
>     // get all file, method, and line numbers
>     let stackList = (new Error()).stack.split('\n').slice(3); 
>     
>     // stack trace format:
>     // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
>     // do not remove the regex expresses to outside of this method (due to a BUG in node.js)
>     let stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
>     let stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;
> 
>     let s = stackList[stackIndex] || stackList[0];
>     let sp = stackReg.exec(s) || stackReg2.exec(s);
> 
>     if (sp && sp.length === 5) {
>         return {
>             method: sp[1],
>             relativePath: path.relative("" + appRoot, sp[2]),
>             line: sp[3],
>             pos: sp[4],
>             file: path.basename(sp[2]),
>             stack: stackList.join('\n')
>         }
>     }
> }
> ```
> 
> 기존 `module.exports = logger;` 지운 후 대체하기
> ```javascript
> module.exports.debug = module.exports.log = message => {
>     arguments[0] = message;
>     logger.debug.apply(logger, formatLogArguments(arguments))
> }
> 
> module.exports.info = message => {
>     arguments[0] = message;
>     logger.info.apply(logger, formatLogArguments(arguments))
> }
> 
> module.exports.warn = message => {
>     arguments[0] = message;
>     logger.warn.apply(logger, formatLogArguments(arguments))
> }
> 
> module.exports.error = message => {
>     arguments[0] = message;
>     logger.error.apply(logger, formatLogArguments(arguments))
> }
> ```
