import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, Input, OnChanges } from '@angular/core';
import * as d3 from 'd3';
declare var $: any;
@Component({
  selector: 'sdrc-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss']
})
export class BarChartComponent implements OnInit, AfterViewInit {
  @ViewChild('barChart') private chartContainer: ElementRef;
  @Input('data') private data: Array<any>;
  @Input('xGrid') private xGrid: boolean;
  @Input('yGrid') private yGrid: boolean;
  @Input('values') private values: boolean;
  @Input() private minWidth: any;
  @Input() private minHeight: any;

  allNullValues:boolean = true;
  constructor(private hostRef: ElementRef) { }

  ngOnInit() {
    // if (this.data) {
    //   this.createChart(this.data);
    // }
  }

  ngAfterViewInit(): void {
    if (this.data) {
      this.createChart(this.data);
    }
  }

  // ngOnChanges(changes){
  //   if(changes.data.currentValue && changes.data.currentValue.length && changes.data.currentValue != changes.data.previousValue){
  //     this.createChart(changes.data.currentValue);
  //   }
  // }

  createChart(data) {
    let el = this.chartContainer.nativeElement;
    d3.select(el).select("svg").remove();
    let n = data.length, // number of layers
      m = 10 // number of samples per layer
    let layers = data;
    layers.forEach(function (layer, i) {
      layer.forEach(function (el, j) {
        el.y = undefined;
        el.y0 = i;
      });
    });

    let cWidth = $(this.hostRef.nativeElement).parent().width();
    let cHeight = $(this.hostRef.nativeElement).parent().height();
    let w = this.minWidth && this.minWidth > cWidth ? this.minWidth : cWidth;
    let h = this.minHeight && this.minHeight > cHeight ? this.minHeight : cHeight;
    let margin = {
      top: 30,
      right: 20,
      bottom: 40,   // bottom height
      left: 20
    },
      width = w - margin.right - margin.left,
      height = h - margin.top - margin.bottom;

    //  var z = d3.scale.scaleOrdinal(['#717171']);
    let x = d3.scaleBand().domain(data[0].map(function (d) {
      return d.axis;
    })).range([0, width]).padding(0.4);

    let max = d3.max(data[0].map(function (d) {
      return parseFloat(d.value);
    }));

    if (max < 100){
      max = 100
    }

    if(max == undefined){
      max = 100
    }

    let y = d3.scaleLinear().domain([0, max]).range(
      [height-margin.top, 0]);

      let color = ["#28bcd4"];

      let hoverColor = ["#017A27", "#FF5900", "#b7191c"];

      let formatTick = function (d) {
      return d.split(".")[0];
    };
    const xBandwidth = x.bandwidth() > 50 * data.length ? 50 * data.length : x.bandwidth();


    let xAxis = d3.axisBottom().scale(x);
    let svg = d3.select(el).append("svg").attr("id",
      "columnbarChart").attr("width",
        width + margin.left + margin.right).attr("height",
          height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + ( max >1000? 55 : 36) + "," + (data[0][0].axis.length > 20 ? 12 : 15) + ")");
    if (this.xGrid) {
      svg.append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0," + height + ")")
        .call(make_x_gridlines()
          .tickSize(-height).tickFormat(null)
        ).selectAll("text").remove();
    }
    // add the Y gridlines
    if (this.yGrid) {
      svg.append("g")
        .attr("class", "grid")
        .call(make_y_gridlines()
          .tickSize(-width).tickFormat(null)
        ).selectAll("text").remove();
    }
     
    let layer = svg.selectAll(".layer").data(layers).enter()
      .append("g").attr("class", "layer").style("fill",
        function (d, i) {
          return color[i];
        }).attr("id", function (d, i) {
          return i;
        });

        let bar = layer.selectAll(".bar")
      .data(function (d) {
        return d;
      })
    .enter().append("g")
      .attr("class", "bar");
      
      let rect = bar.append("rect")
  
    .attr("y", height-margin.top).attr("width", xBandwidth).attr(
      "height", 0)
      
      .style("cursor", (d) => {
        if (d.value) {
          return 'pointer'
        }
        else {
          return 'default'
        }
      })
      
      .on("mouseover", function (d) {
        showPopover.call(this, d)
        d3.select(this)
        .attr('fill', "#16b0c9");
      }).on("mouseout", function (d) {
        removePopovers()
        d3.select(this).attr("fill", function() {
          return "#28bcd4";
      });
      });

      for (let i = 0; i < data.length; i++) {
      bar.append("text")
      .attr("x", function(d) {  
        return x(d.axis) + (x.bandwidth() - xBandwidth) / 2 + xBandwidth / (2 * data.length) + (xBandwidth / data.length * i); })
      .attr("y", 200)
      .style("text-anchor", "middle")
      .style("fill", "#000").text(function (d) {
        return d.value;
      }).style("font-size", "12px");
    }
    // transitionGrouped();
    y.domain([0, max]);
    bar.selectAll("rect").transition().duration(1000).delay(0).attr("x", function (d) {
      return x(d.axis) + (x.bandwidth() - xBandwidth) / 2 + xBandwidth / n * d.y0;    
    }).attr("width", xBandwidth / n).transition().attr(
      "y", function (d) {
        return y(d.value);
      }).attr("height", function (d) {
        return (height - y(d.value))-30;
      });

        bar.selectAll("text")
        .on("mouseover", function (d) {
          showPopover.call(this, d)
        }).on("mouseout", function (d) {
          removePopovers()
        }).transition().duration(2000).delay(0)
        .attr("y", function (d) {
          return y(d.value) - 3;
        })
        .tween("text", function(d) {
          let i = d3.interpolate(0, d.value);
          return function(t) {
            if(d.value){
              if(d.value < 1){
                d3.select(this).text((i(t)));
              }else{
                d3.select(this).text(Math.round(i(t)));
              }
            }
          };
        });

    svg.append("g").attr("class", "x axis").attr("transform",
      "translate(0," + (height-30) + ")").call(xAxis)
      .selectAll("text").style("text-anchor", "middle")
      .attr("font-family", "'Questrial', sans-serif")
      .attr("class", function (d, i) { return "chartBartext" + i })
      .attr("dx", "-.2em").attr("dy", ".70em")
      .call(wrap, x.bandwidth(), width)
      .on("mouseover", function (d) {
        $(this).popover(
          {
            title: '',
            placement: 'top',
            container: 'body',
            trigger: 'manual',
            html: true,
            animation: true,
            content: function () {
                return "<div style='color: #495769;'>" + "<b>" + d + "</b>" + "</div>";
            }
          });
          $(this).popover('show');
      }
     ).on("mouseout", function (d) {
        removePopovers()
      });;

    let yAxis = d3.axisLeft().scale(y).ticks(6);

    svg.append("g").attr("class", "y axis").call(yAxis).append(
      "text").attr("transform", "rotate(-90)")
      .attr("y",function(){
        if(max> 1000){
         return  -40 - margin.left
        }else{
         return -18 - margin.left
        }
      })
      .attr("x", 0 - (height / 3.5)).attr(
          "dy", "1em").attr("text-anchor", "end").style("fill", "#333")
      .style("font-weight", "400")
      .attr("font-family", "'Questrial', sans-serif")
      .style("font-size", "13px")
      .text(data[0][0].unit);

      //check for no data availble
      let allNullValues = true;
      for (let j = 0; j < data.length; j++) {
        for (let k = 0; k < data[j].length; k++) {
          if (data[j][k].value != null) {
            allNullValues = false;
          }
        }
      }
      if (allNullValues) {
          svg.append("text")
            .attr("transform", "translate("+ width/2 +",0)")
            .attr("x", 0)
            .attr("y",30)
            .attr("font-size", "28px")
            .style("text-anchor", "middle")
            .text("Data Not Available");
            return;
      }
    // gridlines in x axis function
    function make_x_gridlines() {
      return d3.axisBottom(x)
        .ticks(5)
    }

    // gridlines in y axis function
    function make_y_gridlines() {
      return d3.axisLeft(y)
        .ticks(5)
    }

    function transitionGrouped() {
      y.domain([0, max]);

      rect.transition().duration(2000).delay(0).attr("x", function (d) {
        return x(d.axis) + (x.bandwidth() - xBandwidth) / 2 + xBandwidth / n * d.y0;    
      }).attr("width", xBandwidth / n).transition().attr(
        "y", function (d) {
          return y(d.value);
        }).attr("height", function (d) {
          return height - y(d.value);
        });
    }

    
    function removePopovers() {
      $('.popover').each(function () {
        $(this).remove();
      });
    }
    function showPopover(d) {
      $(this).popover(
        {
          title: '',
          placement: 'top',
          container: 'body',
          trigger: 'manual',
          html: true,
          animation: true,
          content: function () {
            if(d.axis != '' && d.denominator != null && d.numerator!=null && d.unit == 'Percentage'){
              return "<div style='color: #495769;'>" +"<b>"+ d.axis +"</b>"+ "</div>" + 
              "<div>" +" Data Value : "+"<span style='color: #495769;font-weight:500;'>"+ d.tooltipValue +" (%)"+"</span>"+ "</div>"+
              "<div>" + "Numerator : " +"<span style='color: #495769;font-weight:500'>"+ d.numerator +"</span>"+ "</div>"+
              "<div>" +"Denominator : " +"<span style='color: #495769;font-weight:500'>"+ d.denominator +"</span>"+ "</div>";
            }else if(d.denominator == null && d.numerator==null && d.unit == 'Percentage'){
              return "<div style='color: #495769;'>" +"<b>"+ d.axis +"</b>"+ "</div>" + 
              "<div>" +" Data Value : "+"<span style='color: #495769;font-weight:500;'>"+ d.tooltipValue +" (%)"+"</span>"+ "</div>";
            } else if(d.denominator == null && d.numerator!=null && d.unit == 'Percentage'){
              return "<div style='color: #495769;'>" +"<b>"+ d.axis +"</b>"+ "</div>" + 
              "<div>" +" Data Value : "+"<span style='color: #495769;font-weight:500;'>"+ d.tooltipValue +" (%)"+"</span>"+ "</div>"+
              "<div>" + "Numerator : " +"<span style='color: #495769;font-weight:500'>"+ d.numerator +"</span>"+ "</div>";
            }else if(d.denominator != null && d.numerator==null && d.unit == 'Percentage'){
              return "<div style='color: #495769;'>" +"<b>"+ d.axis +"</b>"+ "</div>" + 
              "<div>" +" Data Value : "+"<span style='color: #495769;font-weight:500;'>"+ d.tooltipValue +" (%)"+"</span>"+ "</div>"+
              "<div>" +"Denominator : " +"<span style='color: #495769;font-weight:500'>"+ d.denominator +"</span>"+ "</div>";
            }
          else{
              return "<div style='color: #495769;'>" + "<b>" + d.axis + "</b>" + "</div>" +
              "<div style='color: #495769;'> Data Value: " + d.tooltipValue + "</div>";
          }
        }
        });
      $(this).popover('show');


    }
    //============Text wrap function in x-axis of column chart=====================



    function wrap(text, width, windowWidth) {
      text.each(function () {
        let text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          cnt = 0,
          line = [],
          textLength = text.node().getComputedTextLength(),
          lineNumber = 0,
          lineHeight = 1,
          y = text.attr("y"),
          ellipsis = text.text('').append('tspan').attr('class', 'elip').text('...'),
          dy = parseFloat(text.attr("dy"));
        if (windowWidth > 660)
          var tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em").style('font-size', '11.5px');
        else
          var tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em").style('font-size', '11.5px');

        if (words.length == 1) {
          let chars = words.toString().split("");
          chars.splice((chars.length / 2).toFixed(), 0, '-', ' ');
          tspan.text(chars.join(""));
          if (tspan.node().getComputedTextLength() > width) {
            words = chars.join("").split(/\s+/).reverse();
          }
          tspan.text('');
        }
        while (word = words.pop()) {
          cnt++;
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            // if(cnt!=1)
            if (width > 660)
              tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").style('font-size', '11.5px').text(word);
            else
              tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").style('font-size', '11.5px').text(word);
          }
        }
      });
    }


  }

}