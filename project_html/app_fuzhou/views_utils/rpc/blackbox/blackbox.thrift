service BlackboxControl {
    string ping(),
    string say(1:string msg,2:string msg2),
    string command(1:string msg)
}
