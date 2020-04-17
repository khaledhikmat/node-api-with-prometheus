This is a Node API in express instrumented with Prometheus. The idea is to install Prometheus and its supporting cast (Alert manager, Grafan and Node exporter) locally so we can experiment with it.

There are two ways to install Prometheus and its suporting cast locally:
- Via Docker Swarm: [https://github.com/vegasbrianc/prometheus](https://github.com/vegasbrianc/prometheus)
- Via a local Linux server such as Ubuntu

## Docker Swarm

*These notes supplement the README file included with the above Github repository.*

- When you make changes, make sure to bounce the stack by removing the satck and re-deploying it:

```
docker stack rm prom
```

and 

```
HOSTNAME=$(hostname) docker stack deploy -c docker-stack.yml prom
```

- When you want to scrape endpoints in host, you must use the `docker.for.mac.locahost` trick [docs.docker.com/config/daemon/prometheus](docs.docker.com/config/daemon/prometheus):

```yml
  - job_name: 'demo'

    # Override the global default and scrape targets from this job every 5 seconds.
    scrape_interval: 15s

    static_configs:
      - targets: ['docker.for.mac.localhost:8800']
        labels:
          deployment: 'production'
```

## Linux Server

My setup here is that I have a Linux machine running like a server where Ubuntu is installed. 

- I downloaded all the Prometheus installation files and run them in different terminals on the Linux machine. 

```
tar xfz prometheus-2.17.1.linux-amd64.tar.tar.gz 
cd prometheus-2.17.1
./prometheus
```

The nice thing about the above is that there is only a single executable.

- In case you downloaded files on Mac machine and u want to transfer those to the Linux machine over SSH:

```
scp /Users/khaled/prometheus-downloads/*.tar.gz khaled@192.168.86.31:/home/khaled/prometheus-downloads
```

where 192.168.86.31 is the Linux server IP address

- To access the different servers from Mac:

```
http://192.168.86.31:9090 - prometheus
http://192.168.86.31:9093 - prometheus alert manager
http://192.168.86.31:3000 - grafana
```

where 192.168.86.31 is the Linux server IP address

- In order to curl the Node API running in Mac:

```
curl 192.168.86.27:8800/hello
curl 192.168.86.27:8800/metrics
```

where 192.168.86.27 is the Mac address

## Local Node API

The Node API is written in `Express` and it uses the middleware feature to auto-install a random delay in calls. 

The following are some additional notes of how you start the applications locally:

- Start the Node API using command line arguments: 

```
node index.js 8800
```

where:
  - arg2 = port number 

- Start the Node loader using command line arguments: 

```
node loader.js localhost 8800 10 /ping /hello/greeting /hello/buddy /configuration/setting
```

where:
  - arg2 = the base url to load (stress)
  - arg3 = the port number
  - arg4 = max ceiling for the random pauses
  - arg5 ...argn = paths to target 

## Queries

Template variables page 108
PromQL page 209

- Counters: the total is of little use on its own!! What we really want to know is how quickly the counter is increasing over time. This is usually done using the rate function, though the increase and irate functions also operate on counter values.

*Average bytes per second per path:*

```
avg without(job, instance, deployment, method) (rate(demo_http_bytes[5m]))
```

- Counters: the total is of little use on its own!! What we really want to know is how quickly the counter is increasing over time. This is usually done using the rate function, though the increase and irate functions also operate on counter values.

*Average bytes per second per path:*

```
avg without(job, instance, deployment, method) (rate(demo_http_bytes[5m]))
```

- Gauges: are a snapshot of state! Usually when aggregating them we want to take a sum, average, minimum, or maximum.

*Sum of requests per path:*

```
sum without(job, instance, deployment, method) (demo_http_pending_requests)
```


