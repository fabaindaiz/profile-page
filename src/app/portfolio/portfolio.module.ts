import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioRoutingModule } from './portfolio-routing.module';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ProjectComponent } from './project/project.component';
import { SocialComponent } from './social/social.component';
import { IconComponent } from '../core/icon/icon.component';

@NgModule({
  declarations: [
    HomeComponent,
    AboutComponent,
    ProjectComponent,
    SocialComponent
  ],
  imports: [
    CommonModule,
    PortfolioRoutingModule,
    IconComponent
  ]
})
export class PortfolioModule { }
