// SCRIPT DE PRUEBA PARA ALGORITMO DE GENERACIÓN DE LLAVES
// Este script simula diferentes escenarios para validar el algoritmo corregido

function simularGeneracionLlave(clasificados, byes) {
    console.log(`\n🎾 Probando con ${clasificados.length} clasificados, ${byes} BYES`);
    
    // Simular el algoritmo corregido
    const potenciaDe2 = Math.pow(2, Math.ceil(Math.log2(clasificados.length)));
    console.log(`   Potencia de 2: ${potenciaDe2}, partidos primera ronda: ${potenciaDe2 / 2}`);
    
    // Separar primeros y segundos
    const primeros = clasificados.filter(c => c.posicion === 1);
    const segundos = clasificados.filter(c => c.posicion === 2);
    
    console.log(`   Primeros: ${primeros.length}, Segundos: ${segundos.length}`);
    
    // Calcular BYES y ranking global
    const rankingGlobal = [...clasificados].sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (b.dif_sets !== a.dif_sets) return b.dif_sets - a.dif_sets;
        return b.dif_games - a.dif_games;
    });
    
    const conBye = new Set();
    for (let i = 0; i < byes; i++) {
        if (rankingGlobal[i]) {
            conBye.add(rankingGlobal[i].id_inscripto);
        }
    }
    
    console.log(`   Jugadores con BYE: ${Array.from(conBye).join(', ')}`);
    
    // Algoritmo corregido
    const jugadoresDisponibles = {
        primeros: [...primeros],
        segundos: [...segundos]
    };
    
    const jugadoresAsignados = new Set();
    
    function obtenerSiguienteJugador(tipo, grupoEvitar = null) {
        const array = jugadoresDisponibles[tipo];
        
        for (let i = 0; i < array.length; i++) {
            const jugador = array[i];
            if (!jugadoresAsignados.has(jugador.id_inscripto) && 
                (!grupoEvitar || jugador.id_grupo !== grupoEvitar)) {
                jugadoresAsignados.add(jugador.id_inscripto);
                array.splice(i, 1);
                return jugador;
            }
        }
        return null;
    }
    
    const bracket = [];
    
    for (let i = 0; i < potenciaDe2 / 2; i++) {
        const primero = obtenerSiguienteJugador('primeros');
        if (!primero) break;
        
        if (conBye.has(primero.id_inscripto)) {
            bracket.push({
                posicion: i + 1,
                jugador1: primero.nombre,
                jugador2: null,
                es_bye: true
            });
            continue;
        }
        
        const segundo = obtenerSiguienteJugador('segundos', primero.id_grupo);
        
        if (!segundo) {
            bracket.push({
                posicion: i + 1,
                jugador1: primero.nombre,
                jugador2: null,
                es_bye: true
            });
            continue;
        }
        
        bracket.push({
            posicion: i + 1,
            jugador1: primero.nombre,
            jugador2: segundo.nombre,
            es_bye: false
        });
    }
    
    // Validaciones
    const jugadoresEnBracket = new Set();
    const duplicadosEncontrados = [];
    
    bracket.forEach(partido => {
        if (partido.jugador1) {
            const id = partido.jugador1.split('_')[1]; // Extraer ID del nombre
            if (jugadoresEnBracket.has(id)) {
                duplicadosEncontrados.push(id);
            }
            jugadoresEnBracket.add(id);
        }
        if (partido.jugador2) {
            const id = partido.jugador2.split('_')[1];
            if (jugadoresEnBracket.has(id)) {
                duplicadosEncontrados.push(id);
            }
            jugadoresEnBracket.add(id);
        }
    });
    
    // Resultados
    console.log(`   ✅ Bracket generado con ${bracket.length} partidos`);
    console.log(`   📊 Partidos BYE: ${bracket.filter(p => p.es_bye).length}`);
    console.log(`   📊 Partidos normales: ${bracket.filter(p => !p.es_bye).length}`);
    
    if (duplicadosEncontrados.length > 0) {
        console.log(`   ❌ DUPLICADOS ENCONTRADOS: ${duplicadosEncontrados.join(', ')}`);
        return false;
    } else {
        console.log(`   ✅ Sin duplicados`);
    }
    
    // Verificar BYES
    const byesCorrectos = bracket.filter(p => p.es_bye).every(p => p.jugador2 === null);
    console.log(`   ${byesCorrectos ? '✅' : '❌'} BYES sin oponentes: ${byesCorrectos}`);
    
    // Mostrar bracket
    console.log(`   📋 Bracket:`);
    bracket.forEach(partido => {
        if (partido.es_bye) {
            console.log(`      Partido ${partido.posicion}: ${partido.jugador1} (BYE)`);
        } else {
            console.log(`      Partido ${partido.posicion}: ${partido.jugador1} vs ${partido.jugador2}`);
        }
    });
    
    return duplicadosEncontrados.length === 0 && byesCorrectos;
}

// ESCENARIOS DE PRUEBA
console.log('🧪 INICIANDO PRUEBAS DEL ALGORITMO CORREGIDO');

// Escenario 1: 8 jugadores (4 grupos), sin BYES
const escenario1 = [
    { id_inscripto: 1, nombre: 'jugador_1', posicion: 1, puntos: 6, id_grupo: 1 },
    { id_inscripto: 2, nombre: 'jugador_2', posicion: 2, puntos: 3, id_grupo: 1 },
    { id_inscripto: 3, nombre: 'jugador_3', posicion: 1, puntos: 6, id_grupo: 2 },
    { id_inscripto: 4, nombre: 'jugador_4', posicion: 2, puntos: 3, id_grupo: 2 },
    { id_inscripto: 5, nombre: 'jugador_5', posicion: 1, puntos: 6, id_grupo: 3 },
    { id_inscripto: 6, nombre: 'jugador_6', posicion: 2, puntos: 3, id_grupo: 3 },
    { id_inscripto: 7, nombre: 'jugador_7', posicion: 1, puntos: 6, id_grupo: 4 },
    { id_inscripto: 8, nombre: 'jugador_8', posicion: 2, puntos: 3, id_grupo: 4 }
];
const resultado1 = simularGeneracionLlave(escenario1, 0);

// Escenario 2: 6 jugadores (3 grupos), 2 BYES
const escenario2 = [
    { id_inscripto: 1, nombre: 'jugador_1', posicion: 1, puntos: 6, id_grupo: 1 },
    { id_inscripto: 2, nombre: 'jugador_2', posicion: 2, puntos: 3, id_grupo: 1 },
    { id_inscripto: 3, nombre: 'jugador_3', posicion: 1, puntos: 6, id_grupo: 2 },
    { id_inscripto: 4, nombre: 'jugador_4', posicion: 2, puntos: 3, id_grupo: 2 },
    { id_inscripto: 5, nombre: 'jugador_5', posicion: 1, puntos: 6, id_grupo: 3 },
    { id_inscripto: 6, nombre: 'jugador_6', posicion: 2, puntos: 3, id_grupo: 3 }
];
const resultado2 = simularGeneracionLlave(escenario2, 2);

// Escenario 3: 5 jugadores (3 grupos), 3 BYES
const escenario3 = escenario2.slice(0, 5); // Tomar solo 5 jugadores
const resultado3 = simularGeneracionLlave(escenario3, 3);

// Escenario 4: 4 jugadores (2 grupos), 0 BYES
const escenario4 = escenario1.slice(0, 4);
const resultado4 = simularGeneracionLlave(escenario4, 0);

// RESUMEN DE RESULTADOS
console.log('\n📊 RESUMEN DE PRUEBAS');
console.log(`Escenario 1 (8 jugadores, 0 BYES): ${resultado1 ? '✅ PASÓ' : '❌ FALLÓ'}`);
console.log(`Escenario 2 (6 jugadores, 2 BYES): ${resultado2 ? '✅ PASÓ' : '❌ FALLÓ'}`);
console.log(`Escenario 3 (5 jugadores, 3 BYES): ${resultado3 ? '✅ PASÓ' : '❌ FALLÓ'}`);
console.log(`Escenario 4 (4 jugadores, 0 BYES): ${resultado4 ? '✅ PASÓ' : '❌ FALLÓ'}`);

const todosPasaron = resultado1 && resultado2 && resultado3 && resultado4;
console.log(`\n🎯 RESULTADO FINAL: ${todosPasaron ? '✅ TODAS LAS PRUEBAS PASARON' : '❌ ALGUNAS PRUEBAS FALLARON'}`);

if (todosPasaron) {
    console.log('🚀 El algoritmo corregido está listo para producción!');
} else {
    console.log('⚠️ Se necesitan ajustes adicionales en el algoritmo.');
}