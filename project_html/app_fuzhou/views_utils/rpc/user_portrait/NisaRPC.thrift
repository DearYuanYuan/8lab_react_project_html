service NisaRPC {  
    string sayHello()  
    string train(1:string argslist,2:string ttype)
    string getmodel(1:string user)
    string getuserlist()
    string controlCentre(1:string argslist)
    string putknowledge(1:string knowledge)
}  
