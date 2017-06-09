const DOT_COLOR = 'red'; //cor dos pontos de controle
const DOT_RADIUS = 10; // raio dos pontos de controle
const PATH_COLOR = 'blue'; // cor dos caminhos de controle
const PATH_STROKE = 5; // espessura da linha
const CURVE_COLOR = 'black'; // cor das curvas de bezier
const CURVE_STROKE = 5; // espessura da curva

var pathPol = []; // caminho de controle
var pathCurve = []; // caminho da curva
var pathDer = []; // caminho da derivada

var bezierCurve; // curvas original
var bezierDer; // curva estendida

var controlPoints = []; // pontos de controle da curva original
var controlPointsDer = []; // pontos de controle da curva estendida

var curveDer;
var curveDer2;
var vetorDev;

var dots = []; // pontos da curva
var dotsDer = []; // pontos da curva 
var evaluations = 500; // quantidade de avaliacoes
var t = 50; // range da derivada
var showDots = true; // toggle pontos de controle
var showPoligonal = true; // toggle caminho de controle
var showCurve = true; // toggle curvas de besier
var showDerivada = true; // toggle derivada
var sx = stage.options.width / 2 , // usado para delimitar a area clicavel da janela
    sy = stage.options.height / 2;

// listener para verificar se o usuario quer mudar as avaliaçoes
stage.on('message:receiveEvaluation', function(data) {
	evaluations = data.data;
	drawCasteljau();
	generateMap();
})

// listeners para escutar se o usuario quer ocultar os pontos, a poligonal de controle ou as curvas de besier
stage.on('message:receivePontosBox', function(toggleControlDotsEvent) {
	showDots = toggleControlDotsEvent.data;
	generateMap();
})


stage.on('message:receivePoligonalBox', function(togglePoligonalEvent) {
	showPoligonal = togglePoligonalEvent.data;
	generateMap();
})

stage.on('message:receiveCurvaBox', function(toggleCurveEvent) {
	showCurve = toggleCurveEvent.data;
	generateMap();
})

// calcula a derivada quando o t é setado
stage.on('message:receiveRange', function(rangeEvent) {
	pathDer = []; 
	t = 1 - rangeEvent.data /100.0;
	t = t * (bezierDer.length/2);
	t = parseInt(t);
	vetorDev = new Path([bezierDer[2*t],bezierDer[2*t+1],bezierDer[2*t]+curveDer[2*t],bezierDer[2*t+1]+curveDer[2*t+1]]);
	vetorDev.moveTo(0,0).stroke('red', CURVE_STROKE);
	pathDer.push(vetorDev);
	generateMap();
})

// inicia a ação de click
stage.on('click', function(clickEvent) {
	var exist = false;
	var x1 = Math.min(clickEvent.x, sx);
    var y1 = Math.min(clickEvent.y, sy);
	for(var i = 0; i < dots.length; i++) {
		if(clickEvent.target == dots[i]) {
			controlPoints[i].x = x1;
			controlPoints[i].y = y1;
			controlPointsDer[i].x = x1 + sx;
			controlPointsDer[i].y = y1;
			exist = true
		}
	}
	if(!exist) {
		// Event on Drag
		dotsDer.push(new Circle(x1 + sx, y1, DOT_RADIUS).attr('fillColor', DOT_COLOR));
		dots.push(new Circle(x1, y1, DOT_RADIUS).attr('fillColor', DOT_COLOR).on('drag', function(dragEvent){
      		this.attr({"x": Math.min(dragEvent.x, sx) ,"y": Math.min(dragEvent.y, sy)})
      		for(var j = 0; j < dots.length; j++){
      			dotsDer[i].attr('x', dots[i].attr('x') + sx); 
      			dotsDer[i].attr('y', dots[i].attr('y')); 
      		}
    	}));
		controlPoints.push(new Point(x1, y1))
		controlPointsDer.push(new Point(x1 + sx, y1))
	}
	if(dots.length > 0) {
		var pathsPolygon = [];
		for(var i = 0; i < dots.length-1; i++) {
			pathsPolygon.push(new Path([['moveTo', dots[i].attr('x'), dots[i].attr('y')],
			 					['lineTo', dots[i + 1].attr('x'), dots[i + 1].attr('y')]
			 					]).stroke(PATH_COLOR, PATH_STROKE))
			pathsPolygon.push(new Path([['moveTo', dotsDer[i].attr('x'), dotsDer[i].attr('y')],
			 					['lineTo', dotsDer[i + 1].attr('x'), dotsDer[i + 1].attr('y')]
			 					]).stroke(PATH_COLOR, PATH_STROKE))
		}

		pathPol = pathsPolygon
		drawCasteljau()
		generateMap()
	}
});

stage.on('doubleclick', function(doubleclick) {
	for(var i = 0; i < dots.length; i++) {
		if(doubleclick.target == dots[i]) {
			dots.splice(i, 1)
			controlPoints.splice(i, 1)
			dotsDer.splice(i, 1)
			controlPointsDer.splice(i, 1)
		}
	}
	var pathsPolygon = []
	for(var i = 0; i < dots.length-1; i++) {
		pathsPolygon.push(new Path([['moveTo', dots[i].attr('x'), dots[i].attr('y')],
		 					['lineTo', dots[i + 1].attr('x'), dots[i + 1].attr('y')]
		 					]).stroke(PATH_COLOR, PATH_STROKE))
		pathsPolygon.push(new Path([['moveTo', dotsDer[i].attr('x'), dotsDer[i].attr('y')],
		 					['lineTo', dotsDer[i + 1].attr('x'), dotsDer[i + 1].attr('y')]
		 					]).stroke(PATH_COLOR, PATH_STROKE))
	}

	pathPol = pathsPolygon
	pathDer = []
	drawCasteljau()
	generateMap()
})

function drawCasteljau(){
	pathCurve = [];
	bezierCurve = [];
	bezierDer = [];
	curveDer = [];
	curveDer2 = [];
  	if(controlPoints.length > 2){
  		for (var j = 0; j <= 1; j += 1 / evaluations) {
    		var aux = [];
    		var aux2 = [];
    		aux = controlPoints; 
    		aux2 = controlPointsDer;
    		while (aux.length > 1) {
      			var aux3 = [];
      			var aux4 = [];
      			if(aux.length == 2)  {
                    var vetor = new Point((controlPointsDer.length - 1)*(aux2[1].x - aux2[0].x),(controlPointsDer.length - 1) * (aux2[1].y - aux2[0].y));
                } 
      			for (var i = 0; i < aux.length - 1; i++) {
        			var ponto = new Point((j * aux[i].x + (1 - j)*aux[i + 1].x), (j * aux[i].y + (1 - j)*aux[i + 1].y)) //interpolacao
        			var ponto2 = new Point((j * aux2[i].x + (1 - j)*aux2[i + 1].x), (j * aux2[i].y + (1 - j)*aux2[i + 1].y))
        			aux3.push(ponto)
        			aux4.push(ponto2)
      			}
      		
      			aux = aux3;
      			aux2 = aux4;
    		}
	    	curveDer.push(vetor.x);
	    	curveDer.push(vetor.y);
	    	bezierCurve.push(aux[0].x);
	    	bezierCurve.push(aux[0].y);
	    	bezierDer.push(aux2[0].x);
	    	bezierDer.push(aux2[0].y);
  		}
  	}
  	var curva = new Path(bezierCurve).moveTo(0,0).stroke(CURVE_COLOR, CURVE_STROKE);
  	var curva2 = new Path(bezierDer).moveTo(0,0).stroke(CURVE_COLOR, CURVE_STROKE);
 	pathCurve.push(curva);
 	pathCurve.push(curva2)
  }

function derivata(pointD){
	
	
}	

function generateMap() {
	var stageObjects = []
	if(showCurve) {
		pathCurve.forEach(function(curve) {
			stageObjects.push(curve)
		});
	}
	if(showDots) {
		dots.forEach(function(circle) {
			stageObjects.push(circle)
		});
		dotsDer.forEach(function(circle) {
			stageObjects.push(circle)
		});
	}
	if(showPoligonal) {
		pathPol.forEach(function(poli) {
			stageObjects.push(poli)
		})
	}
	if(showDerivada) {
		pathDer.forEach(function(der) {
			stageObjects.push(der)
		})
	}
	stage.children(stageObjects)
}