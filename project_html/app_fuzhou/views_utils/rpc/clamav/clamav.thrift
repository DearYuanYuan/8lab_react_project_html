namespace py clamav

service ClamavRPCService {
    string freshClam(),
    map<string, string> clamScan(),
    string stopScan(),
    string suspendScan(),
    string resumeScan(),
    bool isRunning(),
    string checkVersion(),
    string getSummary(),
    string getClamavLog(),
    bool sayHello(),
}
