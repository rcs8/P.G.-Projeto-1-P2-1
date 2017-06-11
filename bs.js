const DOT_COLOR = 'blue';
const DOT_COLOR_DER1 = 'green'
const DOT_COLOR_DER2 = 'orange'
const DOT_COLOR_DER3 = 'grey'
const DOT_RADIUS = 10;
const PATH_COLOR = 'red';
const PATH_STROKE = 4;
const CURVE_COLOR = 'black';
const CURVE_STROKE = 4;

//caminhos de controle
var pathPoligonal = [];
var pathDer = [];
var pathDer2 = [];
//caminho da curva original e da derivada
var pathCurve = [];
var bezierCurve = [];
var bezierDer1 = [];
// pontos de controle
var cPoints = [];
var cDer1 = [];
// pontos de controle das derivadas
var der1 = [];
var der2 = [];
var der3 = [];
// circulos exibidos na tela
var dots = [];
var dotsDer1 = [];
var dotsDer2 = [];
var dotsDer3 = [];
// quantidade de avaliações da curva de bezier
var evaluations = 100;
// Mostrar Circulos, Poligonal e Curva respectivamente
var showDots = true;
var showPoligonal = true;
var showCurve = true;

// calculo feito para delimitar a tela aos 4 quadrantes
var sx = stage.options.width/ 2,
    sy = stage.options.height/ 2;
var split = new Path().stroke('black', 5).addTo(stage);
split.moveTo(0, sy);
split.lineTo(stage.options.width, sy);
split.lineTo(sx, sy);
split.lineTo(sx, 0);
split.lineTo(sx, stage.options.height);


// Eventos de exibição

stage.on('message:receiveEvaluation', function(data) {
	evaluations = data.data;
	getDerivada();
	drawCasteljau();
	generateMap();
})

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

// insere pontos de controle
stage.on('click', function(clickEvent) {
    var exist = false;
	var x1 = Math.min(clickEvent.x, sx);
    var y1 = Math.min(clickEvent.y, sy);
    for(var i = 0; i < dots.length; i++) {
		if(clickEvent.target == dots[i]) {
			cPoints[i].x = x1;
			cPoints[i].y = y1;
			cDer1[i].x = x1 + sx;
			cDer1[i].y = y1;
			exist = true
		}
	}
	if(!exist) {
	    // move os pontos de controle
		dots.push(new Circle(x1, y1, DOT_RADIUS).attr('fillColor', DOT_COLOR).on('drag', function(dragEvent){
      		this.attr({"x": Math.min(dragEvent.x, sx) ,"y": Math.min(dragEvent.y, sy)})
      		for(var j = 0; j < dots.length; j++){
      		}
    	}));
		cPoints.push(new Point(x1, y1))
		cDer1.push(new Point(x1 + sx, y1))
	}
	if(dots.length > 0) {
		var pathsPoly = [];
		for(var i = 0; i < dots.length-1; i++) {
			pathsPoly.push(new Path([['moveTo', dots[i].attr('x'), dots[i].attr('y')],
			 					['lineTo', dots[i + 1].attr('x'), dots[i + 1].attr('y')]
			 					]).stroke(PATH_COLOR, PATH_STROKE))
		}
		pathPoligonal = pathsPoly
        getDerivada()
		drawCasteljau()
		generateMap()
	}
})

// evento de remoção de pontos de controle k
stage.on('doubleclick', function(doubleclick) {
	for(var i = 0; i < dots.length; i++) {
		if(doubleclick.target == dots[i]) {
		    // remove no index 1 um elemento dos pontos de controle
			dots.splice(i, 1)
			cPoints.splice(i, 1)
			cDer1.splice(i, 1)
		}
	}
	var pathsPoly = []
	// recalcula a poligonal
	for(var i = 0; i < dots.length-1; i++) {
		pathsPoly.push(new Path([['moveTo', dots[i].attr('x'), dots[i].attr('y')],
		 					['lineTo', dots[i + 1].attr('x'), dots[i + 1].attr('y')]
		 					]).stroke(PATH_COLOR, PATH_STROKE))
	}

	pathPoligonal = pathsPoly
	getDerivada()
	drawCasteljau()
	generateMap()
})

// funçao que calcula a derivada baseado na quantidade de pontos de controle da curva original
function getDerivada(){
    var aux = cDer1.length;
    var aux1 = [];
    var x = 0;
    var y = 0;
    var x1 = 0;
    var y1 = 0;
    aux1 = cDer1;
    der1 = [];
    der2 = [];
    der3 = [];
    dotsDer1 = [];
    dotsDer2 = [];
    dotsDer3 = [];
    pathDer = [];
    pathDer2 = [];
    if(aux > 1){ // Derivada de um ponto é 0
        if(aux == 2){
            // x1 e x2 controlam onde o ponto será exibido para cada derivada ficar de acordo com seu local na tela
            x =  (aux1[1].x - aux1[0].x)
            y =  (aux1[1].y - aux1[0].y)
            x1 = Math.min(Math.abs(x) + sx, stage.options.width - 15)
            y1 = Math.min(Math.abs(y), sy )
            der1.push(new Point(x1, y1))
            dotsDer1.push(new Circle(x1 , y1, DOT_RADIUS).attr('fillColor',DOT_COLOR_DER1))
        }else if (aux == 3){
           for(var j = 1; j < aux1.length ; j++){
                x = (aux1[j].x - aux1[j - 1].x)
                y =  (aux1[j].y - aux1[j - 1].y)
                x1 = Math.min(Math.abs(x) + sx, stage.options.width - 15)
                y1 = Math.min(Math.abs(y), sy)
                der1.push(new Point(x1, y1))
                dotsDer1.push(new Circle(x1 , y1, DOT_RADIUS).attr('fillColor',DOT_COLOR_DER1))
           }
            x = (der1[1].x - der1[0].x)
            y = (der1[1].y - der1[0].y)
            x1 = Math.min(Math.abs(x) + sx, stage.options.width - 15)
            y1 = Math.min(Math.abs(y) + sy, stage.options.height - 40)
            der2.push(new Point(x1, y1))
            dotsDer2.push(new Circle(x1 , y1, DOT_RADIUS).attr('fillColor',DOT_COLOR_DER2))
            var pathsPoly = []
        	for(var i = 0; i < dotsDer1.length-1; i++) {
        		pathsPoly.push(new Path([['moveTo', dotsDer1[i].attr('x'), dotsDer1[i].attr('y')],
        		 					['lineTo', dotsDer1[i + 1].attr('x'), dotsDer1[i + 1].attr('y')]
        		 					]).stroke(PATH_COLOR, PATH_STROKE))
        	}
        	pathDer = pathsPoly;
        } else if(aux == 4) {
            for(var j = 1; j < aux1.length ; j++){
                x = (aux1[j].x - aux1[j - 1].x)
                y = (aux1[j].y - aux1[j - 1].y)
                x1 = Math.min(Math.abs(x) + sx, stage.options.width - 15)
                y1 = Math.min(Math.abs(y), sy)
                der1.push(new Point(x1, y1))
                dotsDer1.push(new Circle(x1 , y1, DOT_RADIUS).attr('fillColor',DOT_COLOR_DER1))
           }
           for(var j = 1; j < der1.length ; j++){
                x = (der1[j].x - der1[j - 1].x)
                y = (der1[j].y - der1[j - 1].y)
                x1 = Math.min(Math.abs(x) + sx, stage.options.width - 15)
                y1 = Math.min(Math.abs(y) + sy, stage.options.height - 40)
                der2.push(new Point(x1, y1))
                dotsDer2.push(new Circle(x1 , y1, DOT_RADIUS).attr('fillColor',DOT_COLOR_DER2))
           }
            x = (der2[1].x - der2[0].x)
            y =  (der2[1].y - der2[0].y)
            x1 = Math.min(Math.abs(x), sx + 15)
            y1 = Math.min(Math.abs(y) + sy, stage.options.height - 40 )
            der3.push(new Point(x1, y1))
            dotsDer3.push(new Circle(x1 , y1, DOT_RADIUS).attr('fillColor',DOT_COLOR_DER3))
            var pathsPoly = []
            var pathsPoly2 = []
        	for(var i = 0; i < dotsDer1.length-1; i++) {
        		pathsPoly.push(new Path([['moveTo', dotsDer1[i].attr('x'), dotsDer1[i].attr('y')],
        		 					['lineTo', dotsDer1[i + 1].attr('x'), dotsDer1[i + 1].attr('y')]
        		 					]).stroke(PATH_COLOR, PATH_STROKE))
        	}
        	for(var i = 0; i < dotsDer2.length-1; i++) {
        		pathsPoly2.push(new Path([['moveTo', dotsDer2[i].attr('x'), dotsDer2[i].attr('y')],
        		 					['lineTo', dotsDer2[i + 1].attr('x'), dotsDer2[i + 1].attr('y')]
        		 					]).stroke(PATH_COLOR, PATH_STROKE))
        	}
        	pathDer = pathsPoly;
        	pathDer2 = pathsPoly2;
        }
    }
}

function drawCasteljau(){
    // reseta as curvas
    pathCurve = [];
    bezierCurve = [];
    bezierDer1 = [];
    // Programa inicia o calculo da curva original usando o algoritmo de deCasteljau
    if(cPoints.length > 2){
        for(var j = 0; j <= 1;j += 1/evaluations){
            var aux = [];
            aux = cPoints;
            while (aux.length > 1) {
      			var aux2 = [];
      			for (var i = 0; i < aux.length - 1; i++) {
        			var ponto = new Point((j * aux[i].x + (1 - j)*aux[i + 1].x), (j * aux[i].y + (1 - j)*aux[i + 1].y)) //interpolacao
        			aux2.push(ponto)
      			}
      			aux = aux2;
    		}
    		bezierCurve.push(aux[0].x);
	    	bezierCurve.push(aux[0].y);
        }
        // Programa inicia o calculo da curva da derivada usando o algoritmo de deCasteljau
        if(der1.length == 3){
           for(var j = 0; j <= 1;j += 1/evaluations){
                var aux3 = [];
                aux3 = der1;
                while (aux3.length > 1) {
          			var aux4 = [];
          			for (var i = 0; i < aux3.length - 1; i++) {
            			var ponto2 = new Point((j * aux3[i].x + (1 - j)*aux3[i + 1].x), (j * aux3[i].y + (1 - j)*aux3[i + 1].y)) //interpolacao
            			aux4.push(ponto2)
          			}
          			aux3 = aux4;
        		}
        		bezierDer1.push(aux3[0].x);
    	    	bezierDer1.push(aux3[0].y);
            }
            // cria a curva da derivada e insere no array de curvas
	    	var curva2 = new Path(bezierDer1).moveTo(0,0).stroke(CURVE_COLOR, CURVE_STROKE);
 	        pathCurve.push(curva2);
        }
    // cria a curva original e insere no array de curvas
    var curva = new Path(bezierCurve).moveTo(0,0).stroke(CURVE_COLOR, CURVE_STROKE);
 	pathCurve.push(curva);
 	}
}

// Generate Map controla oq será exibido na tela quando o usuario clicar nas checkboxes
function generateMap() {
	var stageObjects = []
	stageObjects.push(split);
	if(showDots) {
		dots.forEach(function(circle) {
			stageObjects.push(circle)
		});
		dotsDer1.forEach(function(circle){
		    stageObjects.push(circle)
		})
		dotsDer2.forEach(function(circle){
		    stageObjects.push(circle)
		})	
		dotsDer3.forEach(function(circle){
		    stageObjects.push(circle)
		})
	}
	if(showPoligonal) {
		pathPoligonal.forEach(function(poli) {
			stageObjects.push(poli)
		})
		pathDer.forEach(function(poli) {
			stageObjects.push(poli)
		})
		pathDer2.forEach(function(poli) {
			stageObjects.push(poli)
		})
	}
	if(showCurve) {
		pathCurve.forEach(function(curve) {
			stageObjects.push(curve)
		});
	}
	stage.children(stageObjects)
}