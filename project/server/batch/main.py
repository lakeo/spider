import signal
from project.server.batch.worker import WorkerPool

def run(work_size):
    # init work pool
    pool = WorkerPool(10)
    # ctrl c listener
    def shutdown_handler(signal_number, stack_frame):
        pool.shutdown()
    signal.signal(signal.SIGTERM, shutdown_handler)
    # task

if __name__ == '__main__':
    run(10)