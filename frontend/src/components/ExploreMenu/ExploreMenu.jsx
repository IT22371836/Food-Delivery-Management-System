import React from 'react';
import './ExploreMenu.css'
import { menu_list } from '../../assets/assets';

const ExploreMenu = ({category,setCategory}) => {
  return (
    <div className='explore-menu' id ='explore-menu'>
      <h1>Explore our menu</h1>
      <p className='explore-menu-text' style={{ color: 'black' }}>Explore our diverse menu to discover an array of delicious options, each crafted to delight your taste buds and elevate your dining experience</p>
      <div className="explore-menu-list">
        {menu_list.map((item,index)=>{
            return(
                <div onClick ={()=>setCategory(prev=>prev===item.menu_name?"ALL":item.menu_name)}key={index}className='explore-menu-list-item'>
                <img className={category===item.menu_name?"active":""} src={item.menu_image} alt="" />
                <p style={{ color: 'black' }}>{item.menu_name}</p>
            </div>
            )


        })}
      </div>
      <hr/>
    </div>
  );
}

export default ExploreMenu;
