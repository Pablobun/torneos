/*
  Simulador offline de armado de llaves (sin BD)
  - No toca server.js ni MySQL
  - Ejecuta casos: 4..32 (pares)
  - Verifica estructura y cruces por grupo
*/

function potencia2Inferior(n) {
  return Math.pow(2, Math.floor(Math.log2(n)));
}

function ordenarRankingGlobal(clasificados) {
  return [...clasificados].sort((a, b) => {
    if (a.posicion !== b.posicion) return a.posicion - b.posicion;
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    if (b.dif_sets !== a.dif_sets) return b.dif_sets - a.dif_sets;
    if (b.dif_games !== a.dif_games) return b.dif_games - a.dif_games;
    return a.id_inscripto - b.id_inscripto;
  });
}

function armarLlaveOffline(clasificados) {
  const totalClasificados = clasificados.length;
  const modoEstrictoGrupos = true;
  const p = potencia2Inferior(totalClasificados);
  const jugadoresAEliminar = totalClasificados - p;
  const jugadoresAHacerJugar = jugadoresAEliminar * 2;
  const jugadoresConBye = totalClasificados - jugadoresAHacerJugar;

  const rankingGlobal = ordenarRankingGlobal(clasificados);
  const rankingIndexById = new Map(rankingGlobal.map((j, idx) => [j.id_inscripto, idx]));
  const directos = rankingGlobal.slice(0, jugadoresConBye);
  const preJugadores = jugadoresAHacerJugar > 0 ? rankingGlobal.slice(-jugadoresAHacerJugar) : [];

  const numPartidosPrimeraRonda = p / 2;
  const partidosPrePlayoff = jugadoresAEliminar;

  const partidosDD = Math.max(0, jugadoresConBye - numPartidosPrimeraRonda);
  const partidosDS = jugadoresConBye - partidosDD * 2;
  const partidosSS = numPartidosPrimeraRonda - partidosDD - partidosDS;

  const espaciosGanadoresEsperados = partidosDS + partidosSS * 2;

  const posicionesDS = [];
  let izq = 1;
  let der = numPartidosPrimeraRonda;
  while (posicionesDS.length < partidosDS && izq <= der) {
    posicionesDS.push(izq);
    if (posicionesDS.length < partidosDS && izq !== der) posicionesDS.push(der);
    izq++;
    der--;
  }

  const posicionesRestantes = [];
  for (let i = 1; i <= numPartidosPrimeraRonda; i++) {
    if (!posicionesDS.includes(i)) posicionesRestantes.push(i);
  }
  const posicionesDD = posicionesRestantes.slice(0, partidosDD);

  const plantilla = {};
  for (let pos = 1; pos <= numPartidosPrimeraRonda; pos++) {
    const mitad = pos <= numPartidosPrimeraRonda / 2 ? "superior" : "inferior";
    if (posicionesDD.includes(pos)) {
      plantilla[pos] = { tipo: "DD", mitad, slotDirecto: [1, 2], slotVacios: [] };
    } else if (posicionesDS.includes(pos)) {
      const slotDirecto = mitad === "superior" ? 1 : 2;
      plantilla[pos] = { tipo: "DS", mitad, slotDirecto: [slotDirecto], slotVacios: [slotDirecto === 1 ? 2 : 1] };
    } else {
      plantilla[pos] = { tipo: "SS", mitad, slotDirecto: [], slotVacios: [1, 2] };
    }
  }

  const gruposMap = new Map();
  for (const c of clasificados) {
    if (!gruposMap.has(c.id_grupo)) gruposMap.set(c.id_grupo, {});
    const entry = gruposMap.get(c.id_grupo);
    if (c.posicion === 1) entry.primero = c;
    if (c.posicion === 2) entry.segundo = c;
  }

  const directSet = new Set(directos.map((x) => x.id_inscripto));
  const preSet = new Set(preJugadores.map((x) => x.id_inscripto));
  const gruposCompletos = [];
  for (const [idGrupo, v] of gruposMap.entries()) {
    if (v.primero && v.segundo) {
      gruposCompletos.push({
        idGrupo,
        primero: v.primero,
        segundo: v.segundo,
        p1d: directSet.has(v.primero.id_inscripto) ? 1 : 0,
        p2d: directSet.has(v.segundo.id_inscripto) ? 1 : 0,
        p1p: preSet.has(v.primero.id_inscripto) ? 1 : 0,
        p2p: preSet.has(v.segundo.id_inscripto) ? 1 : 0,
      });
    }
  }

  const directTop = Object.values(plantilla)
    .filter((x) => x.mitad === "superior")
    .reduce((acc, x) => acc + x.slotDirecto.length, 0);
  const directBottom = Object.values(plantilla)
    .filter((x) => x.mitad === "inferior")
    .reduce((acc, x) => acc + x.slotDirecto.length, 0);
  const preTop = Object.values(plantilla)
    .filter((x) => x.mitad === "superior")
    .reduce((acc, x) => acc + x.slotVacios.length, 0) * 2;
  const preBottom = Object.values(plantilla)
    .filter((x) => x.mitad === "inferior")
    .reduce((acc, x) => acc + x.slotVacios.length, 0) * 2;

  const directosProtegidosIds = directos.slice(0, partidosDS).map((j) => j.id_inscripto);
  const dsDirectSlotsTop = Object.values(plantilla)
    .filter((x) => x.tipo === "DS" && x.mitad === "superior")
    .length;
  const dsDirectSlotsBottom = Object.values(plantilla)
    .filter((x) => x.tipo === "DS" && x.mitad === "inferior")
    .length;

  let bestMask = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  let bestPrePosCost = Number.POSITIVE_INFINITY;
  let bestCrucePosCost = Number.POSITIVE_INFINITY;
  const totalMasks = Math.pow(2, gruposCompletos.length);
  for (let mask = 0; mask < totalMasks; mask++) {
    let dTop = 0;
    let dBottom = 0;
    let pTop = 0;
    let pBottom = 0;
    let protTop = 0;
    let protBottom = 0;
    let directPrimTop = 0;
    let directPrimBottom = 0;
    let directSegTop = 0;
    let directSegBottom = 0;
    let prePrimTop = 0;
    let prePrimBottom = 0;
    let preSegTop = 0;
    let preSegBottom = 0;
    for (let i = 0; i < gruposCompletos.length; i++) {
      const g = gruposCompletos[i];
      const inv = ((mask >> i) & 1) === 1;
      if (!inv) {
        dTop += g.p1d;
        dBottom += g.p2d;
        pTop += g.p1p;
        pBottom += g.p2p;
        directPrimTop += g.p1d;
        directSegBottom += g.p2d;
        prePrimTop += g.p1p;
        preSegBottom += g.p2p;
      } else {
        dTop += g.p2d;
        dBottom += g.p1d;
        pTop += g.p2p;
        pBottom += g.p1p;
        directSegTop += g.p2d;
        directPrimBottom += g.p1d;
        preSegTop += g.p2p;
        prePrimBottom += g.p1p;
      }

      if (directosProtegidosIds.includes(g.primero.id_inscripto)) {
        if (!inv) protTop++;
        else protBottom++;
      }
      if (directosProtegidosIds.includes(g.segundo.id_inscripto)) {
        if (!inv) protBottom++;
        else protTop++;
      }
    }

    if (modoEstrictoGrupos) {
      if (dTop !== directTop || dBottom !== directBottom) continue;
      if (pTop !== preTop || pBottom !== preBottom) continue;
      if (protTop !== dsDirectSlotsTop || protBottom !== dsDirectSlotsBottom) continue;
    }

    const score = Math.abs(dTop - directTop) + Math.abs(dBottom - directBottom) + Math.abs(pTop - preTop) + Math.abs(pBottom - preBottom);
    const prePosCost = Math.abs(prePrimTop - preSegTop) + Math.abs(prePrimBottom - preSegBottom);
    const crucePosCost = Math.abs(directPrimTop - directSegTop) + Math.abs(directPrimBottom - directSegBottom);
    if (
      score < bestScore ||
      (score === bestScore && prePosCost < bestPrePosCost) ||
      (score === bestScore && prePosCost === bestPrePosCost && crucePosCost < bestCrucePosCost)
    ) {
      bestScore = score;
      bestPrePosCost = prePosCost;
      bestCrucePosCost = crucePosCost;
      bestMask = mask;
      if (score === 0 && prePosCost === 0 && crucePosCost === 0) break;
    }
  }

  if (modoEstrictoGrupos && bestScore === Number.POSITIVE_INFINITY) {
    throw new Error("Sin orientación válida respetando separación de grupos");
  }

  const mitadRequerida = new Map();
  for (let i = 0; i < gruposCompletos.length; i++) {
    const g = gruposCompletos[i];
    const inv = ((bestMask >> i) & 1) === 1;
    if (!inv) {
      mitadRequerida.set(g.primero.id_inscripto, "superior");
      mitadRequerida.set(g.segundo.id_inscripto, "inferior");
    } else {
      mitadRequerida.set(g.primero.id_inscripto, "inferior");
      mitadRequerida.set(g.segundo.id_inscripto, "superior");
    }
  }

  const primeraRonda = [];
  for (let pos = 1; pos <= numPartidosPrimeraRonda; pos++) {
    primeraRonda.push({ posicion: pos, id1: null, id2: null, g1: null, g2: null, tipo: plantilla[pos].tipo, mitad: plantilla[pos].mitad });
  }

  const dsSlots = [];
  const ddPartidos = [];
  for (let pos = 1; pos <= numPartidosPrimeraRonda; pos++) {
    for (const slot of plantilla[pos].slotDirecto) {
      const s = { pos, slot, mitad: plantilla[pos].mitad, used: false };
      if (plantilla[pos].tipo === "DS") dsSlots.push(s);
      else if (!ddPartidos.some((p) => p.pos === pos)) ddPartidos.push({ pos, mitad: plantilla[pos].mitad });
    }
  }

  function buscarSlot(pool, jugador, mitadPreferida) {
    let cands = pool.filter((x) => !x.used);
    if (mitadPreferida) {
      const filtered = cands.filter((x) => x.mitad === mitadPreferida);
      if (filtered.length > 0) {
        cands = filtered;
      } else if (modoEstrictoGrupos) {
        return null;
      }
    }
    for (const c of cands) {
      const partido = primeraRonda[c.pos - 1];
      if (partido.g1 !== jugador.id_grupo && partido.g2 !== jugador.id_grupo) return c;
    }
    if (modoEstrictoGrupos) return null;
    return pool.find((x) => !x.used) || null;
  }

  const directosProtegidos = directos.slice(0, partidosDS);
  const directosResto = directos.slice(partidosDS);

  const protegidosPendientes = [...directosProtegidos];
  for (const ds of dsSlots) {
    if (protegidosPendientes.length === 0) break;
    let idx = protegidosPendientes.findIndex((j) => (mitadRequerida.get(j.id_inscripto) || ds.mitad) === ds.mitad);
    if (idx === -1) {
      if (modoEstrictoGrupos) throw new Error("Sin protegido DS en mitad requerida");
      idx = 0;
    }
    const j = protegidosPendientes.splice(idx, 1)[0];
    const slot = buscarSlot(dsSlots, j, mitadRequerida.get(j.id_inscripto) || ds.mitad);
    if (!slot) throw new Error("Sin slot DS");
    const pMatch = primeraRonda[slot.pos - 1];
    if (slot.slot === 1) {
      pMatch.id1 = j.id_inscripto;
      pMatch.g1 = j.id_grupo;
    } else {
      pMatch.id2 = j.id_inscripto;
      pMatch.g2 = j.id_grupo;
    }
    slot.used = true;
  }

  const restantesDD = [...directosResto];
  ddPartidos.sort((a, b) => a.pos - b.pos);
  for (const dd of ddPartidos) {
    let candidatos = restantesDD.filter(j => (mitadRequerida.get(j.id_inscripto) || dd.mitad) === dd.mitad);
    if (candidatos.length < 2) {
      if (modoEstrictoGrupos) throw new Error("Faltan directos DD en mitad requerida");
      candidatos = [...restantesDD];
    }

    let par = null;
    for (let i = 0; i < candidatos.length && !par; i++) {
      for (let j = i + 1; j < candidatos.length && !par; j++) {
        if (candidatos[i].id_grupo !== candidatos[j].id_grupo && candidatos[i].posicion !== candidatos[j].posicion) {
          par = [candidatos[i], candidatos[j]];
        }
      }
    }

    if (!par) {
      for (let i = 0; i < candidatos.length && !par; i++) {
        for (let j = i + 1; j < candidatos.length && !par; j++) {
          if (candidatos[i].id_grupo !== candidatos[j].id_grupo) {
            par = [candidatos[i], candidatos[j]];
          }
        }
      }
    }

    if (!par) throw new Error("No se pudo formar par DD valido");

    const [a, b] = par;
    const idxA = restantesDD.findIndex(x => x.id_inscripto === a.id_inscripto);
    if (idxA >= 0) restantesDD.splice(idxA, 1);
    const idxB = restantesDD.findIndex(x => x.id_inscripto === b.id_inscripto);
    if (idxB >= 0) restantesDD.splice(idxB, 1);

    const pMatch = primeraRonda[dd.pos - 1];
    pMatch.id1 = a.id_inscripto;
    pMatch.g1 = a.id_grupo;
    pMatch.id2 = b.id_inscripto;
    pMatch.g2 = b.id_grupo;
  }

  const vacios = [];
  for (let pos = 1; pos <= numPartidosPrimeraRonda; pos++) {
    for (const slot of plantilla[pos].slotVacios) {
      vacios.push({ pos, slot, mitad: plantilla[pos].mitad });
    }
  }

  const preTopList = [];
  const preBottomList = [];
  for (const j of preJugadores) {
    const mitad = mitadRequerida.get(j.id_inscripto) || (preTopList.length <= preBottomList.length ? "superior" : "inferior");
    if (mitad === "superior") preTopList.push(j);
    else preBottomList.push(j);
  }
  function costoParejaPre(a, b) {
    let costo = 0;
    if (a.posicion === b.posicion) costo += 100;
    const ra = rankingIndexById.get(a.id_inscripto) ?? 999;
    const rb = rankingIndexById.get(b.id_inscripto) ?? 999;
    costo += Math.abs(ra - rb) * 0.001;
    return costo;
  }

  function armarParesOptimos(lista) {
    const jugadores = [...lista];
    if (jugadores.length === 0) return [];
    if (jugadores.length % 2 !== 0) return null;

    const n = jugadores.length;
    const usados = new Array(n).fill(false);
    let mejorCosto = Number.POSITIVE_INFINITY;
    let mejorPares = null;

    function backtrack(actual, costoActual) {
      if (costoActual >= mejorCosto) return;

      let i = -1;
      for (let k = 0; k < n; k++) {
        if (!usados[k]) { i = k; break; }
      }

      if (i === -1) {
        mejorCosto = costoActual;
        mejorPares = [...actual];
        return;
      }

      usados[i] = true;
      for (let j = i + 1; j < n; j++) {
        if (usados[j]) continue;
        const a = jugadores[i];
        const b = jugadores[j];
        if (a.id_grupo === b.id_grupo) continue;

        usados[j] = true;
        actual.push([a, b]);
        backtrack(actual, costoActual + costoParejaPre(a, b));
        actual.pop();
        usados[j] = false;
      }
      usados[i] = false;
    }

    backtrack([], 0);
    if (mejorPares) return mejorPares;

    // fallback greedy
    const src = [...jugadores];
    const pares = [];
    while (src.length >= 2) {
      const j1 = src.shift();
      let idx = src.findIndex((x) => x.id_grupo !== j1.id_grupo && x.posicion !== j1.posicion);
      if (idx === -1) idx = src.findIndex((x) => x.id_grupo !== j1.id_grupo);
      if (idx === -1) idx = 0;
      const j2 = src.splice(idx, 1)[0];
      pares.push([j1, j2]);
    }
    return pares;
  }

  if (preTopList.length % 2 !== 0 || preBottomList.length % 2 !== 0) {
    if (preTopList.length % 2 !== 0 && preBottomList.length % 2 !== 0) {
      if (preTopList.length >= preBottomList.length && preTopList.length > 0) preBottomList.push(preTopList.pop());
      else if (preBottomList.length > 0) preTopList.push(preBottomList.pop());
    } else if (preTopList.length % 2 !== 0 && preTopList.length > 0) {
      preBottomList.push(preTopList.pop());
    } else if (preBottomList.length % 2 !== 0 && preBottomList.length > 0) {
      preTopList.push(preBottomList.pop());
    }
  }

  if (preTopList.length % 2 !== 0 || preBottomList.length % 2 !== 0) {
    throw new Error("No se pudo balancear pre-playoffs por mitad");
  }

  const paresTop = armarParesOptimos(preTopList);
  const paresBottom = armarParesOptimos(preBottomList);
  if (!paresTop || !paresBottom) {
    throw new Error("No se pudo armar cruces válidos de pre-playoff");
  }

  const prePares = [...paresTop, ...paresBottom];
  const prePlayoff = [];
  const destinosPre = [];

  let prePos = 1;
  for (const [j1, j2] of prePares) {
    prePlayoff.push({ posicion: prePos, id1: j1.id_inscripto, id2: j2.id_inscripto, g1: j1.id_grupo, g2: j2.id_grupo, mitadObjetivo: mitadRequerida.get(j1.id_inscripto) || mitadRequerida.get(j2.id_inscripto) || "superior" });
    prePos++;
  }

  for (const pre of prePlayoff) {
    let bestIdx = 0;
    let bestScore2 = Number.POSITIVE_INFINITY;
    for (let i = 0; i < vacios.length; i++) {
      const v = vacios[i];
      const score = v.mitad === pre.mitadObjetivo ? 0 : 10;
      if (modoEstrictoGrupos && score > 0) continue;
      if (score < bestScore2) {
        bestScore2 = score;
        bestIdx = i;
      }
    }
    if (modoEstrictoGrupos && bestScore2 === Number.POSITIVE_INFINITY) {
      throw new Error("Sin destino de mitad correcta para pre-playoff");
    }
    const dest = vacios.splice(bestIdx, 1)[0];
    destinosPre.push({ prePos: pre.posicion, pos: dest.pos, slot: dest.slot });
  }

  return {
    N: totalClasificados,
    P: p,
    jugadoresAEliminar,
    jugadoresAHacerJugar,
    jugadoresConBye,
    partidosDD,
    partidosDS,
    partidosSS,
    espaciosGanadoresEsperados,
    partidosPrePlayoff,
    prePlayoff,
    primeraRonda,
    destinosPre,
    mitadRequerida,
    gruposMap,
  };
}

function generarFixture(N) {
  const grupos = N / 2;
  const out = [];
  let id = 100;
  for (let g = 1; g <= grupos; g++) {
    out.push({ id_inscripto: id++, id_grupo: g, posicion: 1, puntos: 100 - g, dif_sets: 30 - g, dif_games: 50 - g });
    out.push({ id_inscripto: id++, id_grupo: g, posicion: 2, puntos: 60 - g, dif_sets: 10 - g, dif_games: 20 - g });
  }
  return out;
}

function generarFixtureAleatorio(N) {
  const grupos = N / 2;
  const out = [];
  let id = 1000;

  for (let g = 1; g <= grupos; g++) {
    // Siempre mantiene 1ro y 2do por grupo, pero varía desempates
    const p1 = 70 + Math.floor(Math.random() * 31);
    const p2 = 20 + Math.floor(Math.random() * 41);
    const ds1 = Math.floor(Math.random() * 40) - 10;
    const ds2 = Math.floor(Math.random() * 40) - 10;
    const dg1 = Math.floor(Math.random() * 80) - 20;
    const dg2 = Math.floor(Math.random() * 80) - 20;

    out.push({ id_inscripto: id++, id_grupo: g, posicion: 1, puntos: p1, dif_sets: ds1, dif_games: dg1 });
    out.push({ id_inscripto: id++, id_grupo: g, posicion: 2, puntos: p2, dif_sets: ds2, dif_games: dg2 });
  }

  return out;
}

function validarNoCruceAntesFinal(resultado) {
  const { P, gruposMap, primeraRonda, destinosPre } = resultado;

  const entradaLeaf = new Map();
  for (const p of primeraRonda) {
    if (p.id1 != null) entradaLeaf.set(p.id1, (p.posicion - 1) * 2 + 1);
    if (p.id2 != null) entradaLeaf.set(p.id2, (p.posicion - 1) * 2 + 2);
  }

  for (const d of destinosPre) {
    const pre = resultado.prePlayoff.find((x) => x.posicion === d.prePos);
    if (!pre) continue;
    const leaf = (d.pos - 1) * 2 + d.slot;
    entradaLeaf.set(pre.id1, leaf);
    entradaLeaf.set(pre.id2, leaf);
  }

  const conflictos = [];
  for (const [, group] of gruposMap.entries()) {
    if (!group.primero || !group.segundo) continue;
    const id1 = group.primero.id_inscripto;
    const id2 = group.segundo.id_inscripto;
    const l1 = entradaLeaf.get(id1);
    const l2 = entradaLeaf.get(id2);
    if (!l1 || !l2) {
      conflictos.push(`Grupo ${group.primero.id_grupo}: falta leaf para ${id1}/${id2}`);
      continue;
    }
    const mitad1 = l1 <= P / 2 ? "sup" : "inf";
    const mitad2 = l2 <= P / 2 ? "sup" : "inf";
    if (mitad1 === mitad2) {
      conflictos.push(`Grupo ${group.primero.id_grupo}: mismo camino (${mitad1}) ids ${id1}-${id2}`);
    }
  }

  return conflictos;
}

function validarConteos(resultado) {
  const errores = [];
  if (resultado.partidosPrePlayoff !== resultado.jugadoresAEliminar) {
    errores.push(`prePartidos esperado ${resultado.jugadoresAEliminar} real ${resultado.partidosPrePlayoff}`);
  }
  if (resultado.espaciosGanadoresEsperados !== resultado.partidosPrePlayoff) {
    errores.push(`espaciosGanadores ${resultado.espaciosGanadoresEsperados} != prePartidos ${resultado.partidosPrePlayoff}`);
  }
  if (resultado.prePlayoff.length !== resultado.partidosPrePlayoff) {
    errores.push(`prePlayoff.length ${resultado.prePlayoff.length} != ${resultado.partidosPrePlayoff}`);
  }
  return errores;
}

function validarCrucesPorPosicion(resultado) {
  const errores = [];
  const posPorId = new Map();
  for (const [, g] of resultado.gruposMap.entries()) {
    if (g.primero) posPorId.set(g.primero.id_inscripto, 1);
    if (g.segundo) posPorId.set(g.segundo.id_inscripto, 2);
  }

  const ddPorMitad = {
    superior: [],
    inferior: []
  };

  resultado.primeraRonda
    .filter(p => p.tipo === 'DD' && p.id1 != null && p.id2 != null)
    .forEach(p => {
      ddPorMitad[p.mitad].push(p);
    });

  for (const mitad of ['superior', 'inferior']) {
    const partidos = ddPorMitad[mitad];
    if (partidos.length === 0) continue;

    let c1 = 0;
    let c2 = 0;
    let samePosActual = 0;

    for (const p of partidos) {
      const p1 = posPorId.get(p.id1);
      const p2 = posPorId.get(p.id2);
      if (p1 === 1) c1++;
      if (p1 === 2) c2++;
      if (p2 === 1) c1++;
      if (p2 === 2) c2++;
      if (p1 && p2 && p1 === p2) samePosActual++;
    }

    const samePosMinimo = Math.abs(c1 - c2) / 2;
    if (samePosActual > samePosMinimo) {
      errores.push(`Cruces por posicion no minimizados en mitad ${mitad}: actual=${samePosActual}, minimo=${samePosMinimo}`);
    }
  }

  return errores;
}

function validarPrePlayoffPorPosicion(resultado) {
  const errores = [];
  if (!resultado.prePlayoff || resultado.prePlayoff.length === 0) return errores;

  const posPorId = new Map();
  for (const [, g] of resultado.gruposMap.entries()) {
    if (g.primero) posPorId.set(g.primero.id_inscripto, 1);
    if (g.segundo) posPorId.set(g.segundo.id_inscripto, 2);
  }

  const porMitad = { superior: [], inferior: [] };
  for (const p of resultado.prePlayoff) {
    const mitad = p.mitadObjetivo || "superior";
    porMitad[mitad].push(p);
  }

  for (const mitad of ["superior", "inferior"]) {
    const pares = porMitad[mitad];
    if (pares.length === 0) continue;

    let c1 = 0;
    let c2 = 0;
    let samePosActual = 0;

    for (const p of pares) {
      const a = posPorId.get(p.id1);
      const b = posPorId.get(p.id2);
      if (a === 1) c1++;
      if (a === 2) c2++;
      if (b === 1) c1++;
      if (b === 2) c2++;
      if (a && b && a === b) samePosActual++;
    }

    const samePosMinimo = Math.abs(c1 - c2) / 2;
    if (samePosActual > samePosMinimo) {
      errores.push(`Pre-playoff no minimizado en mitad ${mitad}: actual=${samePosActual}, minimo=${samePosMinimo}`);
    }
  }

  return errores;
}

function ejecutar() {
  const casos = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
  const iteracionesAleatorias = 25;
  let fallos = 0;
  console.log("=== Test de emparejamientos sin BD (modo estricto grupos) ===");

  for (const n of casos) {
    try {
      const fixture = generarFixture(n);
      const res = armarLlaveOffline(fixture);
      const errConteo = validarConteos(res);
      const errGrupo = validarNoCruceAntesFinal(res);
      const errCrucePos = validarCrucesPorPosicion(res);
      const errPrePos = validarPrePlayoffPorPosicion(res);

      const ok = errConteo.length === 0 && errGrupo.length === 0 && errCrucePos.length === 0 && errPrePos.length === 0;
      if (!ok) fallos++;

      console.log(`\nCaso N=${n}: ${ok ? "OK" : "FAIL"}`);
      console.log(`  pre=${res.prePlayoff.length}, directos=${res.jugadoresConBye}, DD=${res.partidosDD}, DS=${res.partidosDS}, SS=${res.partidosSS}`);

      if (!ok) {
        for (const e of errConteo) console.log(`  - ${e}`);
        for (const e of errGrupo) console.log(`  - ${e}`);
        for (const e of errCrucePos) console.log(`  - ${e}`);
        for (const e of errPrePos) console.log(`  - ${e}`);
      }

      // Stress aleatorio para el mismo N
      for (let i = 0; i < iteracionesAleatorias; i++) {
        const fixtureRnd = generarFixtureAleatorio(n);
        const resRnd = armarLlaveOffline(fixtureRnd);
        const errConteoRnd = validarConteos(resRnd);
        const errGrupoRnd = validarNoCruceAntesFinal(resRnd);
        const errCrucePosRnd = validarCrucesPorPosicion(resRnd);
        const errPrePosRnd = validarPrePlayoffPorPosicion(resRnd);
        if (errConteoRnd.length > 0 || errGrupoRnd.length > 0 || errCrucePosRnd.length > 0 || errPrePosRnd.length > 0) {
          fallos++;
          console.log(`  - FAIL random #${i + 1}`);
          for (const e of errConteoRnd) console.log(`    * ${e}`);
          for (const e of errGrupoRnd) console.log(`    * ${e}`);
          for (const e of errCrucePosRnd) console.log(`    * ${e}`);
          for (const e of errPrePosRnd) console.log(`    * ${e}`);
          break;
        }
      }
    } catch (e) {
      fallos++;
      console.log(`\nCaso N=${n}: FAIL`);
      console.log(`  - excepción: ${e.message}`);
    }
  }

  console.log("\n===============================");
  if (fallos === 0) {
    console.log("Resultado: TODOS LOS CASOS OK");
    process.exit(0);
  } else {
    console.log(`Resultado: ${fallos} caso(s) con fallo`);
    process.exit(1);
  }
}

ejecutar();
