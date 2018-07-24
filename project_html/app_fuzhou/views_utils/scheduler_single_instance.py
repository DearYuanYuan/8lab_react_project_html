from apscheduler.schedulers.blocking import BlockingScheduler
class SchedulerSingleInstance(BlockingScheduler):
    """
    定时器的单例
    """
    __instance=None

    def __new__(cls, *args, **kwargs):
        if cls.__instance==None:
            cls.__instance=object.__new__(cls,*args,**kwargs)
        return cls.__instance