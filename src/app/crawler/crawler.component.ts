import {Component, ElementRef, OnInit, ViewEncapsulation} from '@angular/core';
import {CrawlerService} from "../crawler-service/crawler.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Observable} from "rxjs/Observable";
import 'rxjs/add/operator/map';
import * as oboe from "oboe";
import {D3, D3Service} from "d3-ng2-service";
import * as URI from "urijs";
import {createUrlResolverWithoutPackagePrefix} from "@angular/compiler";

@Component({
  selector: 'app-crawler',
  templateUrl: './crawler.component.html',
  styleUrls: ['./crawler.component.css'],
  encapsulation : ViewEncapsulation.None,
})
export class CrawlerComponent implements OnInit {

  targetSite: String;
  crawledData: any[] = [];
  done = false;
  fail = false;
  dots = "";
  private d3: D3; // <-- Define the private member which will hold the d3 reference
  parentNativeElement: any;

  constructor(private route: ActivatedRoute, d3Service: D3Service, element: ElementRef) {
    this.d3 = d3Service.getD3();
    this.parentNativeElement = element.nativeElement;
  }

  ngOnInit() {
    this.doD3();

    setInterval(() => {
      if (this.dots.length > 6) {
        this.dots = "";
      } else {
        this.dots += "."
      }
    }, 200);


    let self = this;
    this.route.params
      .subscribe(params => {
        this.targetSite = params.hostname;

        oboe("/api/crawl?site=" + this.targetSite)
          .node('{errors warnings site}', function (results) {
            self.crawledData.push(results);

            self.root = self.d3.hierarchy(self.crawledTrees, function (d) {
              return d.children;
            });
            let margin = {top: 20, right: 90, bottom: 30, left: 90},
              width = 960 - margin.left - margin.right,
              height = 500 - margin.top - margin.bottom;
            self.root.x0 = height / 2;
            self.root.y0 = 0;

            self.update(self.root)
          })
          .fail(function () {
            self.done = true;
            self.fail = true;
          })
          .done(function () {
            self.done = true;
          });
      });
  }

  getAncestors(path: String) {
    let result = ["/"];
    if (path == "/") {
      return result
    }
    result.push(...path.split("/"));
    return result.filter(function (p) {
      return p != "";
    });
  }

  previousNumber = 0;
  currentTree: any = {
    pathPiece: "/",
    name: "/",
    children: []
  };

  get crawledTrees() {
    if (this.previousNumber != this.crawledData.length) {
      this.previousNumber = this.crawledData.length;
      this.currentTree = this.makeTree();
      return this.currentTree
    } else {
      return this.currentTree;
    }
  }

  makeTree() {
    let tree: any = {
      pathPiece: "/",
      name: "/",
      children: []
    };

    for (let item of this.crawledData) {
      let path = URI(item.site).path();
      let ERRORS = item.errors;
      let WARNINGS = item.warnings;
      let fullPath = this.getAncestors(path);
      let currentNode: any = tree;
      for (let pathPiece of fullPath) {
        let success = false;

        //Iterate over children, find if one pathPiece corresponds to the current path piece
        //If so, set that to the current node.
        //If not, create a node with the right format and values, and step into it.
        if (currentNode.pathPiece == pathPiece) {
          if (fullPath.length == 1 && fullPath[0] == "/") {
            currentNode.meta = {errors: ERRORS, warnings: WARNINGS};
          }
          success = true;
        }
        for (let childNode of currentNode.children) {
          if (childNode.pathPiece == pathPiece) {
            currentNode = childNode;
            success = true;
            break;
          }
        }
        if (!success) {
          let previousPaths = fullPath.slice(0, fullPath.indexOf(pathPiece));
          let name = "";
          if (previousPaths.length == 0) {
            name = pathPiece;
          }
          if (previousPaths.length == 1) {
            name = previousPaths[0] + pathPiece;
          }
          if (previousPaths.length > 1) {
            name = previousPaths[0];
            previousPaths.shift();
            name += previousPaths.join("/") + "/" + pathPiece;
          }

          let childNode: any = {
            "name": decodeURIComponent(name),
            "pathPiece": pathPiece,
            "children": []
          };

          if (pathPiece == fullPath[fullPath.length - 1]) {
            childNode.meta = {errors: ERRORS, warnings: WARNINGS};
          }

          currentNode.children.push(childNode);
          currentNode = childNode;
        }
      }
    }

    return tree;
  }

  doD3() {
    let d3 = this.d3;
    if (this.parentNativeElement !== null) {

      let margin = {top: 20, right: 90, bottom: 30, left: 90},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

      // append the svg object to the body of the page
      // appends a 'group' element to 'svg'
      // moves the 'group' element to the top left margin
      this.svg = d3.select(this.parentNativeElement.getElementsByClassName("d3-target")[0]).append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate("
          + margin.left + "," + margin.top + ")");

      this.i = 0;
      this.duration = 750;


      // declares a tree layout and assigns the size
      this.treemap = d3.tree().size([height, width]);

      // Assigns parent, children, height, depth
      this.root = d3.hierarchy(this.crawledTrees, function (d) {
        return d.children;
      });
      this.root.x0 = height / 2;
      this.root.y0 = 0;
    }
  }


  svg;
  i;
  duration;
  treemap;
  root;

  update(source) {
    let self = this;
    // Assigns the x and y position for the nodes
    let treeData = this.treemap(this.root);

    // Compute the new tree layout.
    let nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) {
      d.y = d.depth * 180
    });

    // ****************** Nodes section ***************************

    // Update the nodes...
    let node = this.svg.selectAll('g.node')
      .data(nodes, function (d: any) {
        return d.id || (d.id = ++this.i);
      });

    // Enter any new modes at the parent's previous position.
    let nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr("transform", function (d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on('click', this.click(self));

    // Add Circle for the nodes
    nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('r', 1e-6)
      .style("fill", function (d: any) {
        return d._children ? "lightsteelblue" : "#fff";
      });

    // Add labels for the nodes
    nodeEnter.append('text')
      .attr("dy", ".35em")
      .attr("x", function (d: any) {
        return d.children || d._children ? -13 : 13;
      })
      .attr("text-anchor", function (d: any) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function (d: any) {
        return d.data.name;
      });

    // UPDATE
    let nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
      .duration(this.duration)
      .attr("transform", function (d) {
        if(typeof d.y == "undefined") {
          debugger;
        }
        return "translate(" + d.y + "," + d.x + ")";
      });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
      .attr('r', 10)
      .style("fill", function (d: any) {
        return d._children ? "lightsteelblue" : "#fff";
      })
      .attr('cursor', 'pointer');


    // Remove any exiting nodes
    let nodeExit = node.exit().transition()
      .duration(this.duration)
      .attr("transform", function (d) {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
      .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
      .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    let link = this.svg.selectAll('path.link')
      .data(links, function (d: any) {
        return d.id;
      });

    // Enter any new links at the parent's previous position.
    let linkEnter = link.enter()
      .insert('path', "g")
      .attr("class", "link")
      .attr('d', function (d) {
        let o = {x: source.x0, y: source.y0};
        return self.diagonal(o, o)
      });

    // UPDATE
    let linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
      .duration(this.duration)
      .attr('d', function (d) {
        return self.diagonal(d, d.parent)
      });

    // Remove any exiting links
    let linkExit = link.exit().transition()
      .duration(this.duration)
      .attr('d', function (d) {
        let o = {x: source.x, y: source.y};
        return self.diagonal(o, o)
      })
      .remove();

    // Store the old positions for transition.
    nodes.forEach(function (d: any) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Creates a curved (diagonal) path from parent to the child nodes
  diagonal(s, d) {
    return `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`
  }

  // Toggle children on click.
  click(self) {
    return function(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      self.update(d);
    }
  }


// Collapse the node and all it's children
  collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(this.collapse);
      d.children = null
    }
  }
}
