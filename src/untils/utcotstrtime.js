export function utctostrtime(time){
    return new Date(time).toLocaleDateString().replace(/\//g, "-") + " " + new Date(time).toTimeString().slice(0, 9);
}