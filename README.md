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
node loader.js http localhost 8800 10 /ping /hello/greeting /hello/buddy /configuration/setting
```

where:
  - arg2 = the base url to load (stress)
  - arg3 = the port number
  - arg4 = max ceiling for the random pauses
  - arg5 ...argn = paths to target 

## Queries

Template variables page 108
PromQL page 209

### Gauges 

Gauges are a snapshot of state! Usually when aggregating them we want to take a sum, average, minimum, or maximum.

*Sum of requests per path:*

```
sum without(job, instance, deployment, method) (demo_http_pending_requests)
```

Because gauges are time series that may go up and down ay any time, it is usually expected to see min, max or average values for each point on the graph. 

*Average value of pending requests*"

```
avg_over_time(demo_http_pending_requests[5m])
```

### Counters 

Counters are ever-increasing...hence they are of little use on their own!! What we really want to know is how quickly the counter is increasing over time. This is usually done using the rate function, though the increase and irate functions also operate on counter values.

*Counter value over time (useless):*

```
demo_http_bytes
```

The Prometheus output is:

```
demo_http_bytes{controller="configuration",instance="localhost:8800",job="demo",method="GET",path="/setting"}	1309.23874047042
demo_http_bytes{controller="ping",instance="localhost:8800",job="demo",method="GET",path="/"}	1334.60345663461
demo_http_bytes{controller="hello",instance="localhost:8800",job="demo",method="GET",path="/greeting"}	1367.4378080477009
demo_http_bytes{controller="hello",instance="localhost:8800",job="demo",method="GET",path="/buddy"}	1683.5865578808355
```

*Counter rate increate over time:*

But if we take a `rate`, the output becomes bytes per second for every controller and path:

```
rate(demo_http_bytes[5m])
```

The Prometheus output becomes:

```
{controller="configuration",instance="localhost:8800",job="demo",method="GET",path="/setting"}	1.8569346761541996
{controller="ping",instance="localhost:8800",job="demo",method="GET",path="/"}	3.2235872491453352
{controller="hello",instance="localhost:8800",job="demo",method="GET",path="/greeting"}	2.2546083310317186
{controller="hello",instance="localhost:8800",job="demo",method="GET",path="/buddy"}	3.1404675343925965
```

*Only bandwidth points that are smaller than 20 bytes per second*:

```
rate(demo_http_bytes[5m]) < 20
```

*Same as above but make the graph binary*:

```
rate(demo_http_bytes[5m]) < bool 20
```

*Aggregated bytes per second:*

The output of the rate function is actually a gauge. So we can now aggrate in a similar way to what we have done for gauges.

1. The sum of bytes per second:  

```
sum (rate(demo_http_bytes[5m]))
```

The Prometheus output becomes:

```
{}	20.56068613987261
```

2. To make it more useful, let us do it again but this time remove the un-necessary labels to force Prometheus to produce our labels:  

```
sum without(job, instance, deployment, method) (rate(demo_http_bytes[5m]))
```

The Prometheus output is: 

```
{controller="hello",path="/buddy"}	2.0358140904354096
{controller="configuration",path="/setting"}	2.8473428183921543
{controller="ping",path="/"}	2.917824151778038
{controller="hello",path="/greeting"}	1.9187000598385104
```

3. Now let us find the average bytes per second for the `hello` controller and `buddy` path:


```
avg without(job, instance, deployment, method) (rate(demo_http_bytes{controller="hello", path="/buddy"}[5m]))
```

The Prometheus output is: 

```
{controller="hello",path="/buddy"}	4.704310204073809
```

OR 

```
avg (rate(demo_http_bytes{controller="hello", path="/buddy"}[5m]))
```

The Prometheus output is: 

```
{}	4.704310204073809
```

### Summaries 

Summaries contain two counters: `sum` and `count`. For example, the `demo_http_summary_duration` summary has those two counters and all counter operations we have seen apply to them:

```
demo_http_summary_duration_count
```

and 

```
demo_http_summary_duration_sum
```

Given these counters, we can do avergae latency for example:

*Average latency*:

```
sum (rate(demo_http_summary_duration_sum[5m])) / sum (rate(demo_http_summary_duration_count[5m]))
```

OR (make sure both sums have the same balanced without)

```
sum without(job, instance, method) (rate(demo_http_summary_duration_sum[5m])) / sum without(job, instance, method) (rate(demo_http_summary_duration_count[5m]))
```

Prometheus output:

```
{controller="hello",path="/greeting"}	0.0005151272222222226
{controller="ping",path="/"}	0.000427552807017544
{controller="configuration",path="/setting"}	0.0005254901408450706
{controller="hello",path="/buddy"}	0.0004608355538461545
```

*Average latency across all controllers*:

To calculate the average latency across all controllers:

```
sum without(path)(
    sum without(job, instance, method)(rate(demo_http_summary_duration_sum[5m]))
) 
/
sum without(path)(
    sum without(job, instance, method)(rate(demo_http_summary_duration_count[5m]))
)
```

Prometheus output:

```
{controller="configuration"}	0.000502071421875
{controller="hello"}	0.000491300736434109
{controller="ping"}	0.0005048062745098014
```

### Histograms

Just like summaries, they have the same built-in counters: `sum` and `count`. So the same operations we have seen on `summaries` can also be applied to `histograms`. In addition, `histograms` have the `bucket` metric which is used to bin your data in different buckets.

*Buckets*

```
demo_http_request_duration_bucket
```

Promethus output:

```
demo_http_request_duration_bucket{controller="hello",instance="192.168.86.27:8800",job="demo",le="0.1",method="GET",path="/greeting"}	456
demo_http_request_duration_bucket{controller="hello",instance="192.168.86.27:8800",job="demo",le="1",method="GET",path="/greeting"}	456
demo_http_request_duration_bucket{controller="hello",instance="192.168.86.27:8800",job="demo",le="2",method="GET",path="/greeting"}	456
demo_http_request_duration_bucket{controller="hello",instance="192.168.86.27:8800",job="demo",le="5",method="GET",path="/greeting"}	456
demo_http_request_duration_bucket{controller="hello",instance="192.168.86.27:8800",job="demo",le="10",method="GET",path="/greeting"}	456
demo_http_request_duration_bucket{controller="hello",instance="192.168.86.27:8800",job="demo",le="20",method="GET",path="/greeting"}	456
demo_http_request_duration_bucket{controller="hello",instance="192.168.86.27:8800",job="demo",le="+Inf",method="GET",path="/greeting"}	456
demo_http_request_duration_bucket{controller="ping",instance="192.168.86.27:8800",job="demo",le="0.1",method="GET",path="/"}	445
demo_http_request_duration_bucket{controller="ping",instance="192.168.86.27:8800",job="demo",le="1",method="GET",path="/"}	445
demo_http_request_duration_bucket{controller="ping",instance="192.168.86.27:8800",job="demo",le="2",method="GET",path="/"}	445
demo_http_request_duration_bucket{controller="ping",instance="192.168.86.27:8800",job="demo",le="5",method="GET",path="/"}	445
demo_http_request_duration_bucket{controller="ping",instance="192.168.86.27:8800",job="demo",le="10",method="GET",path="/"}	445
demo_http_request_duration_bucket{controller="ping",instance="192.168.86.27:8800",job="demo",le="20",method="GET",path="/"}	445
demo_http_request_duration_bucket{controller="ping",instance="192.168.86.27:8800",job="demo",le="+Inf",method="GET",path="/"}	445
demo_http_request_duration_bucket{controller="configuration",instance="192.168.86.27:8800",job="demo",le="0.1",method="GET",path="/setting"}	484
demo_http_request_duration_bucket{controller="configuration",instance="192.168.86.27:8800",job="demo",le="1",method="GET",path="/setting"}	484
demo_http_request_duration_bucket{controller="configuration",instance="192.168.86.27:8800",job="demo",le="2",method="GET",path="/setting"}	484
demo_http_request_duration_bucket{controller="configuration",instance="192.168.86.27:8800",job="demo",le="5",method="GET",path="/setting"}	484
demo_http_request_duration_bucket{controller="configuration",instance="192.168.86.27:8800",job="demo",le="10",method="GET",path="/setting"}	484
demo_http_request_duration_bucket{controller="configuration",instance="192.168.86.27:8800",job="demo",le="20",method="GET",path="/setting"}	484
demo_http_request_duration_bucket{controller="configuration",instance="192.168.86.27:8800",job="demo",le="+Inf",method="GET",path="/setting"}	484
demo_http_request_duration_bucket{controller="hello",instance="192.168.86.27:8800",job="demo",le="0.1",method="GET",path="/buddy"}	499
demo_http_request_duration_bucket{controller="hello",instance="192.168.86.27:8800",job="demo",le="1",method="GET",path="/buddy"}	499
demo_http_request_duration_bucket{controller="hello",instance="192.168.86.27:8800",job="demo",le="2",method="GET",path="/buddy"}	499
demo_http_request_duration_bucket{controller="hello",instance="192.168.86.27:8800",job="demo",le="5",method="GET",path="/buddy"}	499
demo_http_request_duration_bucket{controller="hello",instance="192.168.86.27:8800",job="demo",le="10",method="GET",path="/buddy"}	499
demo_http_request_duration_bucket{controller="hello",instance="192.168.86.27:8800",job="demo",le="20",method="GET",path="/buddy"}	499
demo_http_request_duration_bucket{controller="hello",instance="192.168.86.27:8800",job="demo",le="+Inf",method="GET",path="/buddy"}	499
```

*Percentiles*:

Notice the built-in `le` label which is a counter of how many events have a size less than or equal to the bucket boundary. Mostly we don't have to worry about as there Prometheus functions that take care of that. For example:

```
histogram_quantile(
        0.90,
        rate(demo_http_request_duration_bucket[5m]))
```

Since `demo_http_request_duration_bucket` is a counter, we must first take a rate. 

Prometheus output:

```
{controller="ping",instance="192.168.86.27:8800",job="demo",method="GET",path="/"}	0.08000000000000002
{controller="configuration",instance="192.168.86.27:8800",job="demo",method="GET",path="/setting"}	0.08000000000000002
{controller="hello",instance="192.168.86.27:8800",job="demo",method="GET",path="/buddy"}	0.08000000000000002
{controller="hello",instance="192.168.86.27:8800",job="demo",method="GET",path="/greeting"}	0.08000000000000002
```

The above shows the 90th percentile latency of each controller and path. So 90% of our controller duration are about 0.08 seconds!!

*90% Percentiel across all controllers*:

```
histogram_quantile(
      0.90,
      sum without(job, instance, method, path)(rate(demo_http_request_duration_bucket[5m])))
```

Prometheus output:

```
{controller="ping"}	0.09000000000000001
{controller="configuration"}	0.09000000000000001
{controller="hello"}	0.09000000000000002
```

## Vectors

### Instant Vector

From Prometheus Doc: *An instant vector selector returns an instant vector of the most recent samples before the query evaluation time, which is to say a list of zero or more time series. Each of these time series will have one sample, and a sample contains both a value and a timestamp. While the instant vector returned by an instant vector selector has the timestamp of the original data,9 any instant vectors returned by other operations or functions will have the timestamp of the query evaluation time for all of their values.*

```
demo_http_bytes
```

Prometheus output:

```
demo_http_bytes{controller="hello",instance="192.168.86.27:8800",job="demo",method="GET",path="/greeting"}	44335.32161985693
demo_http_bytes{controller="ping",instance="192.168.86.27:8800",job="demo",method="GET",path="/"}	43936.55853224474
demo_http_bytes{controller="configuration",instance="192.168.86.27:8800",job="demo",method="GET",path="/setting"}	46837.409209483565
demo_http_bytes{controller="hello",instance="192.168.86.27:8800",job="demo",method="GET",path="/buddy"}	47143.67797328946
```

### Range Vector

From Prometheus Doc: *Unlike an instant vector selector which returns one sample per time series, a range vector selector can return many samples for each time series. Range vectors are always used with the rate function*. For example:

```
demo_http_bytes[5m]
```

Prometheus output:

```
demo_http_bytes{controller="hello",instance="192.168.86.27:8800",job="demo",method="GET",path="/greeting"}	40971.40968348915 @1587843256.79
41087.38602227189 @1587843271.79
41199.99978257335 @1587843286.79
41314.22447092872 @1587843301.79
41480.31479593996 @1587843316.79
41647.04003868058 @1587843406.79
41935.82444156232 @1587843421.79
42162.983814438514 @1587843436.79
42360.61121957436 @1587843451.79
42470.49662592936 @1587843511.79
42640.75518319283 @1587843526.79
demo_http_bytes{controller="ping",instance="192.168.86.27:8800",job="demo",method="GET",path="/"}	40368.10763449613 @1587843256.79
40588.07894527228 @1587843271.79
40783.79169842864 @1587843286.79
40965.93968233537 @1587843301.79
41050.502380416314 @1587843316.79
41239.47127034739 @1587843406.79
41314.32989922235 @1587843421.79
41384.25009968458 @1587843436.79
41548.835132273525 @1587843451.79
41876.62746824368 @1587843511.79
41917.87479712952 @1587843526.79
demo_http_bytes{controller="configuration",instance="192.168.86.27:8800",job="demo",method="GET",path="/setting"}	43466.312509294825 @1587843256.79
43624.07671266672 @1587843271.79
43678.99036313104 @1587843286.79
43841.91393569578 @1587843301.79
44098.159874037185 @1587843316.79
44361.5434042176 @1587843406.79
44570.15257390145 @1587843421.79
44711.53583173352 @1587843436.79
44891.21558915924 @1587843451.79
44977.078032787314 @1587843511.79
45115.3443610463 @1587843526.79
demo_http_bytes{controller="hello",instance="192.168.86.27:8800",job="demo",method="GET",path="/buddy"}	43930.53877731935 @1587843256.79
44173.78655218323 @1587843271.79
44219.99212097716 @1587843286.79
44365.339712056484 @1587843301.79
44485.41325667198 @1587843316.79
44800.719526104855 @1587843406.79
44907.521404140396 @1587843421.79
45133.25096583856 @1587843436.79
45424.58327901549 @1587843451.79
45533.59888462343 @1587843511.79
45598.715150009084 @1587843526.79
```

It is really important the difference as only instant vectors can be graphed. Range vectors require other Prometheus functions to convert them to instant vectors and this is exatcly what the `rate` which we have seen above several times:

```
rate(demo_http_bytes[5m])
```

Because ratnge vectors contain data that go back in time, it is important to use functions like `rate` to average them out over that period. Simplified rate calculation for each point looks like:
```
(Vcurr-Vprev)/(Tcurr-Tprev)
```

Where

`Vcurr` is the value at the current point `Tcurr` and `Vprev` is the value at the previous point `Tprev=Tcurr-d` where `d` is the range i.e. `5m`.


