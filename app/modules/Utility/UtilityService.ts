var utils = require("utils/utils");

export default abstract class UtilityService {
    public static openUrl(url: string): void {
        utils.OpenUrl(url);
    }

    public static log(message: any, prefix?: any): void {
        var callerName = prefix ?? this.log.caller.name
        console.log(`[${callerName}]: ${message}`)
    }
}