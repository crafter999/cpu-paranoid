# About
CPU-paranoid is a next-gen reliable cpu usage monitor for Linux. It has 0 dependencies and it uses 
the /proc/stat kernel pseudo file to fetch the data. It uses a stabilizer for better results. 
The lowest value is 0.8% and the bigger 100% just like htop.

Tested on the following Linux Distros and boards using **Node.js v10.x.x-22.x.x**:
- Debian
- CentOS
- Fedora
- Clearlinux
- Alpine
- Raspberry Pi
- Orange Pi

# Install
```bash
npm install cpu-paranoid
```

# Usage

## Class: CpuParanoid

### Constructor
⊕ **new CpuParanoid**(options: IOptions): `CpuParanoid`

#### IOptions Parameters:

**● stabilizer**: *`number`*  
Controls the average result value based on how many values should be considered. Sometimes your CPU may reach 90% in less 
than 10 milliseconds so this is where stabilizer comes in play and based on the previous values from the history it will 
find the right average value. If you want for example instant results use low stability values like 5.

**● updateInterval**: *`number`*  
Set the fetching data frequency from /proc/stat. Use values bigger than 100 ms for better stability.


### Accessors

**● percentage**: *`string`*  

Get the actual CPU value in a range between 0.8~100 just like htop.


### Methods

**● startMonitoring**(): `Promise <void>`    

Start monitor for changes in an infinite loop.  
*Don't forget to run this!*

**● getMemoryUsage**(): `number`    
Get memory usage. (No need to start monitoring)

# Example
```typescript
import {CpuParanoid} from "cpu-paranoid";
let stats = new CpuParanoid({updateInterval: 200,stabilizer: 50});
stats.startMonitoring();

setInterval(async ()=>{
   console.log(stats.percentage);
},1000);
```
