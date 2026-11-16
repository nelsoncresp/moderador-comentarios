# Bitácora del proyecto

## Qué no sabía antes de empezar y cómo lo aprendí

Antes de empezar ya había trabajado con reglas en otros contextos. Usé Rasa y storylines para crear bots, y también desarrollé un sistema médico que relacionaba síntomas como gripa y fiebre con posibles enfermedades. Lo que no había hecho era llevar esa experiencia a la moderación de comentarios, donde una expresión puede tener distintos sentidos según la situación. Por ejemplo, decir que un producto es “basura” puede ser una queja y no necesariamente un insulto contra otra persona.

Durante el reto aprendí a ordenar mejor las reglas y a tener en cuenta el contexto, las tildes, las mayúsculas y la forma en que aparecen las palabras dentro de una frase. Probé el resultado con los 20 comentarios originales y revisé especialmente los casos ambiguos. Preferí una solución local porque es fácil de ejecutar, explicar y mantener, además de no depender de servicios externos.

Al probar variaciones adicionales encontré algunos falsos negativos: ciertas formas de insultos en inglés y consultas sobre estafas que no incluían un dominio no fueron detectadas. Los casos originales sí quedaron cubiertos. Esto me mostró que las reglas funcionan bien para expresiones conocidas, pero necesitan más ejemplos para generalizar mejor.

## Para qué usé la IA y qué tuve que corregir

Usé la IA como apoyo para organizar algunas ideas, revisar alternativas y proponer casos de prueba. Después integré las partes, ejecuté las pruebas y corregí lo que no se ajustaba al objetivo. Tuve que ajustar algunas reglas para que una palabra aislada no definiera toda la clasificación, para diferenciar una consulta sobre una posible estafa de un anuncio y para no tratar cualquier crítica negativa como un insulto.

También tuve que corregir propuestas de interfaz que no eran suficientemente claras y reglas demasiado amplias. La IA sugirió parte de la estructura y algunas expresiones en inglés, pero revisé cada caso y adapté las decisiones a los comentarios de la prueba. La solución final la comprobé con pruebas y con una revisión manual de los resultados.

## Qué comentarios costaron clasificar

El comentario sobre el producto “basura” fue el caso más ambiguo. Lo dejé en `ok` porque expresa una inconformidad con el servicio y no ataca directamente a una persona. El comentario sarcástico sobre una actualización quedó en `revisar`, porque puede ser una crítica válida, pero conviene que lo confirme un moderador. En el caso de `dinero-facil.xyz`, distinguí entre quien pregunta si el enlace es confiable y quien intenta promocionarlo: el primero se revisa y el segundo se clasifica como `spam`.

La pregunta en inglés sobre cómo restablecer la contraseña del BIOS se clasifica como `ok` porque es una consulta técnica normal. También incluí algunas expresiones concretas en inglés relacionadas con amenazas, insultos, publicidad y posibles estafas. Esto permite cubrir los ejemplos de la prueba, pero no significa que la aplicación traduzca cualquier comentario o que pueda interpretar todos los idiomas.

## Qué mejoraría con una semana más

Separaría las decisiones automáticas de las decisiones tomadas por los moderadores, guardando un historial en lugar de modificar directamente el archivo original. También mostraría con mayor claridad por qué un comentario llegó a cada categoría y ampliaría las pruebas con errores ortográficos, sarcasmo, distintas formas de escribir una misma idea y variaciones en inglés. En particular, revisaría las consultas sobre estafas sin dominio para reducir falsos negativos sin convertir cualquier pregunta en una alerta.

Para los comentarios en inglés incorporaría una traducción de apoyo o un glosario ampliable, conservando siempre el texto original. La traducción ayudaría al moderador, pero no debería tomar la decisión por sí sola porque podría cambiar el sentido del mensaje. También ampliaría la revisión de tildes y errores de escritura sin alterar el texto que ve el usuario.

Finalmente agregaría más controles de accesibilidad, pruebas de la interfaz y una forma de medir los falsos positivos y falsos negativos para mejorar las reglas con el uso real.
