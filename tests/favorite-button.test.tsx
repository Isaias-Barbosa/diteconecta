import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import FavoriteButton from '../components/FavoriteButton';

test('estrela comunica o estado e bloqueia cliques durante salvamento',()=>{
 const props={name:'Pessoa Teste',busy:false,disabled:false,onClick:()=>{}};
 const unselected=renderToStaticMarkup(<FavoriteButton {...props} favorite={false}/>);
 assert.match(unselected,/Adicionar Pessoa Teste aos favoritos/);assert.match(unselected,/aria-pressed="false"/);
 const selected=renderToStaticMarkup(<FavoriteButton {...props} favorite/>);
 assert.match(selected,/Remover Pessoa Teste dos favoritos/);assert.match(selected,/aria-pressed="true"/);assert.match(selected,/fill="currentColor"/);
 const saving=renderToStaticMarkup(<FavoriteButton {...props} favorite busy/>);
 assert.match(saving,/disabled=""/);assert.match(saving,/aria-busy="true"/);
});
