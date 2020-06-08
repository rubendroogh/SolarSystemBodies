var utils = require("utils/utils");

export default abstract class UtilityService {
    public static openUrl(url: string): void {
        utils.OpenUrl(url);
    }

    public static getRandomHexColor(): string {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }
      

    public static log(message: any, prefix?: any): void {
        var callerName = prefix ?? this.log.caller.name
        console.log(`[${callerName}]: ${message}`)
    }
}