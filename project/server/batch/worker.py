from threading import Thread
from queue import Queue


class Job(object):
    def __init__(self):
        pass

    def run(self):
        pass


class SuicideJob(Job):
    def run(self, **kw):
        raise Exception('worker kill!')


class SimpleJob(Job):
    def __init__(self, method=None, args=[]):
        super(SimpleJob, self).__init__()
        self.method = method
        self.args = args

    def run(self):
        if isinstance(self.args, list) or isinstance(self.args, tuple):
            self.method(*self.args)
        elif isinstance(self.args, dict):
            self.method(**self.args)


class Worker(Thread):
    def __init__(self, queue):
        super(Worker, self).__init__()
        self.queue = queue
        self.status = True

    def run(self):
        while self.status:
            try:
                job = self.queue.get()
                job.run()
            except Exception as e:
                print(e)
        print('worker stop!')

    def stop(self):
        self.status = False


class WorkerPool:
    def __init__(self, n_workers, shutdown_handler=None):
        if n_workers <= 0:
            raise Exception('worker number is invalid!')
        self._shutdown_handler = shutdown_handler
        self.is_shutdown = False
        self._pool = []
        self.n_workers = n_workers
        self.queue = Queue()
        self._add_workers(self.n_workers)

    def _add_workers(self, workers):
        if workers <= 0:
            raise Exception('worker number is invalid, Unexpected Error!')
        while workers:
            workers -= 1
            self._pool.append(Worker(self.queue))

    def size(self):
        return len(self._pool)

    def start(self):
        for worker in self._pool:
            worker.start()
            worker.setDaemon(False)

    def put(self, job):
        self.queue.put(job)

    def status(self):
        pass

    def _remove_worker(self, worker):
        if worker in self._pool:
            self._pool.remove(worker)

    def shutdown(self):
        if self.is_shutdown:
            return

        for worker in self._pool:
            worker.stop()

        for i in range(len(self._pool)):
            self.queue.put(SuicideJob())

        self.is_shutdown = True

        while len(self._pool):
            worker = self._pool[-1]
            worker.join(3)
            self._remove_worker(worker)

        if self._shutdown_handler:
            self._shutdown_handler()

