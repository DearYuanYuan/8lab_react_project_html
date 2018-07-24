import re

from app_fuzhou.views_utils.logger import logger


class MySQLog:
    def __init__(self):
        self.time_dict = {}
        self.date_list = []
        self.time_tpl = ([])    # a tuple formatted as (date, time, id, log) whose log is at the date line
        self.formatted_logs = None

    def read_logs(self, logs, flag):
        try:
            if len(logs) > 1:
                if flag == "normal":
                    if_time = False
                    date_set = ()
                    for log in logs:
                        log = log.strip("\t").strip(" ").split()
                        # print(log)
                        patten = re.compile(r'\d+:\d{2}:\d{2}')
                        match = patten.match(log[1])
                        if match:
                            if_time = True
                            log_n = ""  # logs lined with time
                            if len(log) > 4:
                                for l in log[3:]:
                                    log_n += l + " "
                            else:
                                log_n = log[3]
                            date_set = (log[0], log[1])
                            self.time_tpl.append((log[0], log[1], log[2], log_n))
                        else:
                            if if_time:
                                log_n = ""  # logs lined with time
                                if len(log) > 4:
                                    for l in log[3:]:
                                        log_n += l + " "
                                else:
                                    log_n = log[1]
                                self.time_tpl.append((date_set[0], date_set[1], log[0], log_n))
                else:
                    log_id = 1
                    for errlog in logs:
                        if len(errlog) > 1:
                            errlog = errlog.split()
                            patten = re.compile(r'\d+:\d{2}:\d{2}')
                            match = patten.match(errlog[1])
                            if match:
                                # print(errlog)
                                log_n = ""  # logs lined with time
                                for l in errlog[3:]:
                                    log_n += l + " "
                                self.time_tpl.append((errlog[0], errlog[1], log_id, log_n))
        except Exception as e:
            logger.error("log error:", e)
        # format_logs = self.format_norm_log()
        # f = open('mysql_norm_log.txt', 'w+')
        # print(format_logs, file=f)
        # f.close()
        return self.format_norm_log()

    def format_norm_log(self):
        format_logs = ""
        for tpl_index in range(len(self.time_tpl)):
            date_str = "[20" + self.time_tpl[tpl_index][0][0] + self.time_tpl[tpl_index][0][1] + "/" + \
                       self.time_tpl[tpl_index][0][2] + self.time_tpl[tpl_index][0][3] + "/" + \
                       self.time_tpl[tpl_index][0][4] + self.time_tpl[tpl_index][0][5] + " " + \
                       self.time_tpl[tpl_index][1] + ".1  0]"
            format_logs += date_str + "\n" + self.time_tpl[tpl_index][3] + "\n"
        return format_logs[len(format_logs) - 1001:] if len(format_logs) > 2000 else format_logs
